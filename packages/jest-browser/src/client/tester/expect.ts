/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable sort-keys */

import {deepEqual} from './deep-equal';

type MatcherResult =
  | boolean
  | {
      message?: () => string;
      pass: boolean;
    };

type Matcher = (
  this: {isNot?: boolean; promise?: '' | 'rejects' | 'resolves'},
  received: unknown,
  ...args: Array<unknown>
) => MatcherResult | Promise<MatcherResult>;

type MatcherTable = Record<string, Matcher>;

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function getPathSegments(path: string): Array<string> {
  if (path.length === 0) {
    return [''];
  }

  return path.split('.');
}

function getPropertyValue(
  obj: unknown,
  path: string,
): {
  exists: boolean;
  value: unknown;
} {
  const segments = getPathSegments(path);
  let current: unknown = obj;

  for (const segment of segments) {
    // eslint-disable-next-line no-new-object
    if (current == null || !(segment in new Object(current))) {
      return {
        exists: false,
        value: undefined,
      };
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return {
    exists: true,
    value: current,
  };
}

function processMatcherResult(
  matcherName: string,
  raw: MatcherResult,
  isNot: boolean,
): void {
  const normalized =
    typeof raw === 'boolean'
      ? {pass: raw}
      : {
          message: raw.message,
          pass: raw.pass,
        };

  const pass = isNot ? !normalized.pass : normalized.pass;
  if (pass) {
    return;
  }

  if (normalized.message) {
    throw new Error(normalized.message());
  }

  throw new Error(
    `${matcherName} assertion failed${isNot ? ' (inverted)' : ''}`,
  );
}

function applyMatcher(
  matcherName: string,
  matcher: Matcher,
  received: unknown,
  args: Array<unknown>,
  isNot: boolean,
  promise: '' | 'rejects' | 'resolves' = '',
): void | Promise<void> {
  const raw = matcher.call({isNot, promise}, received, ...args);

  // Support async matchers (returns a Promise)
  if (
    raw != null &&
    typeof raw === 'object' &&
    'then' in raw &&
    typeof (raw as any).then === 'function'
  ) {
    return raw.then((resolved: MatcherResult) => {
      processMatcherResult(matcherName, resolved, isNot);
    });
  }

  processMatcherResult(matcherName, raw as MatcherResult, isNot);
}

function createCoreMatchers(): MatcherTable {
  return {
    toBe(received: unknown, expected: unknown): MatcherResult {
      return Object.is(received, expected);
    },
    toBeDefined(received: unknown): MatcherResult {
      return received !== undefined;
    },
    toBeFalsy(received: unknown): MatcherResult {
      return Boolean(received) === false;
    },
    toBeGreaterThan(received: unknown, expected: unknown): MatcherResult {
      return Number(received) > Number(expected);
    },
    toBeGreaterThanOrEqual(
      received: unknown,
      expected: unknown,
    ): MatcherResult {
      return Number(received) >= Number(expected);
    },
    toBeInstanceOf(received: unknown, expected: unknown): MatcherResult {
      return (
        received instanceof
        (expected as new (...args: Array<unknown>) => unknown)
      );
    },
    toBeLessThan(received: unknown, expected: unknown): MatcherResult {
      return Number(received) < Number(expected);
    },
    toBeLessThanOrEqual(received: unknown, expected: unknown): MatcherResult {
      return Number(received) <= Number(expected);
    },
    toBeNaN(received: unknown): MatcherResult {
      return Number.isNaN(received);
    },
    toBeNull(received: unknown): MatcherResult {
      return received === null;
    },
    toBeTruthy: Boolean,
    toBeUndefined(received: unknown): MatcherResult {
      return received === undefined;
    },
    toContain(received: unknown, expected: unknown): MatcherResult {
      if (typeof received === 'string') {
        return received.includes(String(expected));
      }

      if (Array.isArray(received)) {
        return received.some(item => deepEqual(item, expected));
      }

      return false;
    },
    toEqual(received: unknown, expected: unknown): MatcherResult {
      return deepEqual(received, expected);
    },
    toHaveLength(received: unknown, expected: unknown): MatcherResult {
      if (received == null) {
        return false;
      }

      const length = (received as {length?: unknown}).length;
      return Number(length) === Number(expected);
    },
    toHaveProperty(
      received: unknown,
      path: unknown,
      expected?: unknown,
    ): MatcherResult {
      if (typeof path !== 'string') {
        return false;
      }

      const resolved = getPropertyValue(received, path);
      if (!resolved.exists) {
        return false;
      }

      if (arguments.length >= 3) {
        return deepEqual(resolved.value, expected);
      }

      return true;
    },
    toMatch(received: unknown, expected: unknown): MatcherResult {
      if (typeof received !== 'string') {
        return false;
      }

      if (expected instanceof RegExp) {
        return expected.test(received);
      }

      return received.includes(String(expected));
    },
    toThrow(received: unknown, expected?: unknown): MatcherResult {
      if (this.promise !== 'rejects' && typeof received !== 'function') {
        return false;
      }

      let thrown = false;
      let thrownValue: unknown;
      let errorMessage = '';

      if (this.promise === 'rejects' && typeof received !== 'function') {
        thrown = true;
        thrownValue = received;
        errorMessage = toMessage(received);
      } else {
        try {
          (received as () => unknown)();
        } catch (error) {
          thrown = true;
          thrownValue = error;
          errorMessage = toMessage(error);
        }
      }

      if (!thrown) {
        return false;
      }

      if (expected === undefined) {
        return true;
      }

      if (typeof expected === 'string') {
        return errorMessage.includes(expected);
      }

      if (expected instanceof RegExp) {
        return expected.test(errorMessage);
      }

      if (typeof expected === 'function') {
        if (thrownValue instanceof Error) {
          return (
            thrownValue instanceof
            (expected as new (...args: Array<unknown>) => unknown)
          );
        }

        return false;
      }

      return false;
    },

    // --- Mock matchers ---
    toHaveBeenCalled(received: unknown): MatcherResult {
      const mock = received as {mock?: {calls: Array<unknown>}};
      if (!mock?.mock)
        return {pass: false, message: () => 'Value is not a mock function'};
      return mock.mock.calls.length > 0;
    },
    toHaveBeenCalledTimes(received: unknown, expected: unknown): MatcherResult {
      const mock = received as {mock?: {calls: Array<unknown>}};
      if (!mock?.mock)
        return {pass: false, message: () => 'Value is not a mock function'};
      return mock.mock.calls.length === expected;
    },
    toHaveBeenCalledWith(
      received: unknown,
      ...expectedArgs: Array<unknown>
    ): MatcherResult {
      const mock = received as {mock?: {calls: Array<Array<unknown>>}};
      if (!mock?.mock)
        return {pass: false, message: () => 'Value is not a mock function'};
      return mock.mock.calls.some(call => deepEqual(call, expectedArgs));
    },
    toHaveBeenLastCalledWith(
      received: unknown,
      ...expectedArgs: Array<unknown>
    ): MatcherResult {
      const mock = received as {mock?: {calls: Array<Array<unknown>>}};
      if (!mock?.mock)
        return {pass: false, message: () => 'Value is not a mock function'};
      const last = mock.mock.calls.at(-1);
      return deepEqual(last, expectedArgs);
    },
    toHaveBeenNthCalledWith(
      received: unknown,
      n: unknown,
      ...expectedArgs: Array<unknown>
    ): MatcherResult {
      const mock = received as {mock?: {calls: Array<Array<unknown>>}};
      if (!mock?.mock)
        return {pass: false, message: () => 'Value is not a mock function'};
      const call = mock.mock.calls[(n as number) - 1];
      return deepEqual(call, expectedArgs);
    },
    toHaveReturned(received: unknown): MatcherResult {
      const mock = received as {mock?: {results: Array<{type: string}>}};
      if (!mock?.mock)
        return {pass: false, message: () => 'Value is not a mock function'};
      return mock.mock.results.some(r => r.type === 'return');
    },
    toHaveReturnedTimes(received: unknown, expected: unknown): MatcherResult {
      const mock = received as {mock?: {results: Array<{type: string}>}};
      if (!mock?.mock)
        return {pass: false, message: () => 'Value is not a mock function'};
      return (
        mock.mock.results.filter(r => r.type === 'return').length === expected
      );
    },
    toHaveReturnedWith(received: unknown, expected: unknown): MatcherResult {
      const mock = received as {
        mock?: {results: Array<{type: string; value: unknown}>};
      };
      if (!mock?.mock)
        return {pass: false, message: () => 'Value is not a mock function'};
      return mock.mock.results.some(
        r => r.type === 'return' && deepEqual(r.value, expected),
      );
    },
    toHaveLastReturnedWith(
      received: unknown,
      expected: unknown,
    ): MatcherResult {
      const mock = received as {
        mock?: {results: Array<{type: string; value: unknown}>};
      };
      if (!mock?.mock)
        return {pass: false, message: () => 'Value is not a mock function'};
      const returns = mock.mock.results.filter(r => r.type === 'return');
      const last = returns.at(-1);
      return last ? deepEqual(last.value, expected) : false;
    },

    // --- Additional common matchers ---
    toStrictEqual(received: unknown, expected: unknown): MatcherResult {
      // Same as toEqual for now (strict would check undefined properties)
      return deepEqual(received, expected);
    },
    toContainEqual(received: unknown, expected: unknown): MatcherResult {
      if (!Array.isArray(received)) return false;
      return received.some(item => deepEqual(item, expected));
    },
    toMatchObject(received: unknown, expected: unknown): MatcherResult {
      if (typeof received !== 'object' || received === null) return false;
      if (typeof expected !== 'object' || expected === null) return false;
      for (const [key, val] of Object.entries(
        expected as Record<string, unknown>,
      )) {
        if (!deepEqual((received as Record<string, unknown>)[key], val))
          return false;
      }
      return true;
    },
    toBeCloseTo(
      received: unknown,
      expected: unknown,
      numDigits?: unknown,
    ): MatcherResult {
      const precision = (numDigits as number) ?? 5;
      const diff = Math.abs((received as number) - (expected as number));
      return diff < Math.pow(10, -precision) / 2;
    },
  };
}

export function createExpect(): {
  (actual: unknown): {
    not: Record<string, (...args: Array<unknown>) => Promise<void> | void>;
    rejects: {
      not: Record<string, (...args: Array<unknown>) => Promise<void>>;
    } & Record<string, (...args: Array<unknown>) => Promise<void>>;
    resolves: {
      not: Record<string, (...args: Array<unknown>) => Promise<void>>;
    } & Record<string, (...args: Array<unknown>) => Promise<void>>;
  } & Record<string, (...args: Array<unknown>) => Promise<void> | void>;
  extend: (extensions: Record<string, Matcher>) => void;
} {
  const matchers: MatcherTable = createCoreMatchers();

  const expectFn = ((actual: unknown) => {
    const expectation: Record<string, unknown> & {
      not: Record<string, (...args: Array<unknown>) => Promise<void> | void>;
      rejects: Record<string, unknown> & {
        not: Record<string, (...args: Array<unknown>) => Promise<void>>;
      };
      resolves: Record<string, unknown> & {
        not: Record<string, (...args: Array<unknown>) => Promise<void>>;
      };
    } = {
      not: {},
      rejects: {not: {}},
      resolves: {not: {}},
    };

    for (const [name, matcher] of Object.entries(matchers)) {
      expectation[name] = (...args: Array<unknown>): void | Promise<void> => {
        return applyMatcher(name, matcher, actual, args, false, '');
      };

      expectation.not[name] = (
        ...args: Array<unknown>
      ): void | Promise<void> => {
        return applyMatcher(name, matcher, actual, args, true, '');
      };

      expectation.resolves[name] = async (
        ...args: Array<unknown>
      ): Promise<void> => {
        const resolved = await Promise.resolve(actual);
        await applyMatcher(name, matcher, resolved, args, false, 'resolves');
      };

      expectation.resolves.not[name] = async (
        ...args: Array<unknown>
      ): Promise<void> => {
        const resolved = await Promise.resolve(actual);
        await applyMatcher(name, matcher, resolved, args, true, 'resolves');
      };

      expectation.rejects[name] = async (
        ...args: Array<unknown>
      ): Promise<void> => {
        let rejected = false;
        let reason: unknown;

        try {
          await Promise.resolve(actual);
        } catch (error) {
          rejected = true;
          reason = error;
        }

        assert(rejected, 'Expected promise to reject but it resolved');
        await applyMatcher(name, matcher, reason, args, false, 'rejects');
      };

      expectation.rejects.not[name] = async (
        ...args: Array<unknown>
      ): Promise<void> => {
        let rejected = false;
        let reason: unknown;

        try {
          await Promise.resolve(actual);
        } catch (error) {
          rejected = true;
          reason = error;
        }

        assert(rejected, 'Expected promise to reject but it resolved');
        await applyMatcher(name, matcher, reason, args, true, 'rejects');
      };
    }

    return expectation as {
      not: Record<string, (...args: Array<unknown>) => Promise<void> | void>;
      rejects: {
        not: Record<string, (...args: Array<unknown>) => Promise<void>>;
      } & Record<string, (...args: Array<unknown>) => Promise<void>>;
      resolves: {
        not: Record<string, (...args: Array<unknown>) => Promise<void>>;
      } & Record<string, (...args: Array<unknown>) => Promise<void>>;
    } & Record<string, (...args: Array<unknown>) => Promise<void> | void>;
  }) as {
    (actual: unknown): {
      not: Record<string, (...args: Array<unknown>) => Promise<void> | void>;
      rejects: {
        not: Record<string, (...args: Array<unknown>) => Promise<void>>;
      } & Record<string, (...args: Array<unknown>) => Promise<void>>;
      resolves: {
        not: Record<string, (...args: Array<unknown>) => Promise<void>>;
      } & Record<string, (...args: Array<unknown>) => Promise<void>>;
    } & Record<string, (...args: Array<unknown>) => Promise<void> | void>;
    extend: (extensions: Record<string, Matcher>) => void;
  };

  expectFn.extend = (extensions: Record<string, Matcher>): void => {
    for (const [name, matcher] of Object.entries(extensions)) {
      matchers[name] = matcher;
    }
  };

  return expectFn;
}
