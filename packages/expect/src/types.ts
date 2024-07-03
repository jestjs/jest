/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {EqualsFunction, Tester} from '@jest/expect-utils';
import type * as jestMatcherUtils from 'jest-matcher-utils';
import type {MockInstance} from 'jest-mock';
import type {INTERNAL_MATCHER_FLAG} from './jestMatchersObject';

export type SyncExpectationResult = {
  pass: boolean;
  message(): string;
};

export type AsyncExpectationResult = Promise<SyncExpectationResult>;

export type ExpectationResult = SyncExpectationResult | AsyncExpectationResult;

export type MatcherFunctionWithContext<
  Context extends MatcherContext = MatcherContext,
  Expected extends
    Array<any> = [] /** TODO should be: extends Array<unknown> = [] */,
> = (
  this: Context,
  actual: unknown,
  ...expected: Expected
) => ExpectationResult;

export type MatcherFunction<Expected extends Array<unknown> = []> =
  MatcherFunctionWithContext<MatcherContext, Expected>;

// TODO should be replaced with `MatcherFunctionWithContext`
export type RawMatcherFn<Context extends MatcherContext = MatcherContext> = {
  (this: Context, actual: any, ...expected: Array<any>): ExpectationResult;
  /** @internal */
  [INTERNAL_MATCHER_FLAG]?: boolean;
};

export type MatchersObject = {
  [name: string]: RawMatcherFn;
};

export type ThrowingMatcherFn = (actual: any) => void;
export type PromiseMatcherFn = (actual: any) => Promise<void>;

export interface MatcherUtils {
  customTesters: Array<Tester>;
  dontThrow(): void;
  equals: EqualsFunction;
  utils: typeof jestMatcherUtils & {
    iterableEquality: Tester;
    subsetEquality: Tester;
  };
}

export interface MatcherState {
  assertionCalls: number;
  currentConcurrentTestName?: () => string | undefined;
  currentTestName?: string;
  error?: Error;
  expand?: boolean;
  expectedAssertionsNumber: number | null;
  expectedAssertionsNumberError?: Error;
  isExpectingAssertions: boolean;
  isExpectingAssertionsError?: Error;
  isNot?: boolean;
  numPassingAsserts: number;
  promise?: string;
  suppressedErrors: Array<Error>;
  testPath?: string;
}

export type MatcherContext = MatcherUtils & Readonly<MatcherState>;

export type AsymmetricMatcher = {
  asymmetricMatch(other: unknown): boolean;
  toString(): string;
  getExpectedType?(): string;
  toAsymmetricMatcher?(): string;
};

export type ExpectedAssertionsErrors = Array<{
  actual: string | number;
  error: Error;
  expected: string;
}>;

export interface BaseExpect {
  assertions(numberOfAssertions: number): void;
  addEqualityTesters(testers: Array<Tester>): void;
  extend(matchers: MatchersObject): void;
  extractExpectedAssertionsErrors(): ExpectedAssertionsErrors;
  getState(): MatcherState;
  hasAssertions(): void;
  setState(state: Partial<MatcherState>): void;
}

export type Expect = (<T = unknown>(
  actual: T,
) => Matchers<void, T> & Inverse<Matchers<void, T>> & PromiseMatchers<T>) &
  BaseExpect &
  AsymmetricMatchers &
  Inverse<Omit<AsymmetricMatchers, 'any' | 'anything'>>;

type Inverse<Matchers> = {
  /**
   * Inverse next matcher. If you know how to test something, `.not` lets you test its opposite.
   */
  not: Matchers;
};

export interface AsymmetricMatchers {
  any(sample: unknown): AsymmetricMatcher;
  anything(): AsymmetricMatcher;
  arrayContaining(sample: Array<unknown>): AsymmetricMatcher;
  closeTo(sample: number, precision?: number): AsymmetricMatcher;
  objectContaining(sample: Record<string, unknown>): AsymmetricMatcher;
  stringContaining(sample: string): AsymmetricMatcher;
  stringMatching(sample: string | RegExp): AsymmetricMatcher;
}

type PromiseMatchers<T = unknown> = {
  /**
   * Unwraps the reason of a rejected promise so any other matcher can be chained.
   * If the promise is fulfilled the assertion fails.
   */
  rejects: Matchers<Promise<void>, T> & Inverse<Matchers<Promise<void>, T>>;
  /**
   * Unwraps the value of a fulfilled promise so any other matcher can be chained.
   * If the promise is rejected the assertion fails.
   */
  resolves: Matchers<Promise<void>, T> & Inverse<Matchers<Promise<void>, T>>;
};

export interface Matchers<R extends void | Promise<void>, T = unknown> {
  /**
   * T is a type param for the benefit of users who extend Matchers. It's
   * intentionally unused and needs to be named T, not _T, for those users.
   * This makes sure TypeScript agrees.
   *
   * @internal
   */
  _unusedT(expected: T): R;
  /**
   * Checks that a value is what you expect. It calls `Object.is` to compare values.
   * Don't use `toBe` with floating-point numbers.
   */
  toBe(expected: unknown): R;
  /**
   * Using exact equality with floating point numbers is a bad idea.
   * Rounding means that intuitive things fail.
   * The default for `precision` is 2.
   */
  toBeCloseTo(expected: number, precision?: number): R;
  /**
   * Ensure that a variable is not undefined.
   */
  toBeDefined(): R;
  /**
   * When you don't care what a value is, you just want to
   * ensure a value is false in a boolean context.
   */
  toBeFalsy(): R;
  /**
   * For comparing floating point numbers.
   */
  toBeGreaterThan(expected: number | bigint): R;
  /**
   * For comparing floating point numbers.
   */
  toBeGreaterThanOrEqual(expected: number | bigint): R;
  /**
   * Ensure that an object is an instance of a class.
   * This matcher uses `instanceof` underneath.
   */
  toBeInstanceOf(expected: unknown): R;
  /**
   * For comparing floating point numbers.
   */
  toBeLessThan(expected: number | bigint): R;
  /**
   * For comparing floating point numbers.
   */
  toBeLessThanOrEqual(expected: number | bigint): R;
  /**
   * Used to check that a variable is NaN.
   */
  toBeNaN(): R;
  /**
   * This is the same as `.toBe(null)` but the error messages are a bit nicer.
   * So use `.toBeNull()` when you want to check that something is null.
   */
  toBeNull(): R;
  /**
   * Use when you don't care what a value is, you just want to ensure a value
   * is true in a boolean context. In JavaScript, there are six falsy values:
   * `false`, `0`, `''`, `null`, `undefined`, and `NaN`. Everything else is truthy.
   */
  toBeTruthy(): R;
  /**
   * Used to check that a variable is undefined.
   */
  toBeUndefined(): R;
  /**
   * Used when you want to check that an item is in a list.
   * For testing the items in the list, this uses `===`, a strict equality check.
   */
  toContain(expected: unknown): R;
  /**
   * Used when you want to check that an item is in a list.
   * For testing the items in the list, this  matcher recursively checks the
   * equality of all fields, rather than checking for object identity.
   */
  toContainEqual(expected: unknown): R;
  /**
   * Used when you want to check that two objects have the same value.
   * This matcher recursively checks the equality of all fields, rather than checking for object identity.
   */
  toEqual(expected: unknown): R;
  /**
   * Ensures that a mock function is called.
   */
  toHaveBeenCalled(): R;
  /**
   * Ensures that a mock function is called an exact number of times.
   */
  toHaveBeenCalledTimes(expected: number): R;
  /**
   * Ensure that a mock function is called with specific arguments.
   */
  toHaveBeenCalledWith(...expected: MockParameters<T>): R;
  /**
   * Ensure that a mock function is called with specific arguments on an Nth call.
   */
  toHaveBeenNthCalledWith(nth: number, ...expected: MockParameters<T>): R;
  /**
   * If you have a mock function, you can use `.toHaveBeenLastCalledWith`
   * to test what arguments it was last called with.
   */
  toHaveBeenLastCalledWith(...expected: MockParameters<T>): R;
  /**
   * Use to test the specific value that a mock function last returned.
   * If the last call to the mock function threw an error, then this matcher will fail
   * no matter what value you provided as the expected return value.
   */
  toHaveLastReturnedWith(expected?: unknown): R;
  /**
   * Used to check that an object has a `.length` property
   * and it is set to a certain numeric value.
   */
  toHaveLength(expected: number): R;
  /**
   * Use to test the specific value that a mock function returned for the nth call.
   * If the nth call to the mock function threw an error, then this matcher will fail
   * no matter what value you provided as the expected return value.
   */
  toHaveNthReturnedWith(nth: number, expected?: unknown): R;
  /**
   * Use to check if property at provided reference keyPath exists for an object.
   * For checking deeply nested properties in an object you may use dot notation or an array containing
   * the keyPath for deep references.
   *
   * Optionally, you can provide a value to check if it's equal to the value present at keyPath
   * on the target object. This matcher uses 'deep equality' (like `toEqual()`) and recursively checks
   * the equality of all fields.
   *
   * @example
   *
   * expect(houseForSale).toHaveProperty('kitchen.area', 20);
   */
  toHaveProperty(
    expectedPath: string | Array<string>,
    expectedValue?: unknown,
  ): R;
  /**
   * Use to test that the mock function successfully returned (i.e., did not throw an error) at least one time
   */
  toHaveReturned(): R;
  /**
   * Use to ensure that a mock function returned successfully (i.e., did not throw an error) an exact number of times.
   * Any calls to the mock function that throw an error are not counted toward the number of times the function returned.
   */
  toHaveReturnedTimes(expected: number): R;
  /**
   * Use to ensure that a mock function returned a specific value.
   */
  toHaveReturnedWith(expected?: unknown): R;
  /**
   * Check that a string matches a regular expression.
   */
  toMatch(expected: string | RegExp): R;
  /**
   * Used to check that a JavaScript object matches a subset of the properties of an object
   */
  toMatchObject(
    expected: Record<string, unknown> | Array<Record<string, unknown>>,
  ): R;
  /**
   * Use to test that objects have the same types as well as structure.
   */
  toStrictEqual(expected: unknown): R;
  /**
   * Used to test that a function throws when it is called.
   */
  toThrow(expected?: unknown): R;
}

/**
 * Obtains the parameters of the given function or {@link MockInstance}'s function type.
 * ```ts
 * type P = MockParameters<MockInstance<(foo: number) => void>>;
 * // or without an explicit mock
 * // type P = MockParameters<(foo: number) => void>;
 *
 * const params1: P = [1]; // compiles
 * const params2: P = ['bar']; // error
 * const params3: P = []; // error
 * ```
 *
 * This is similar to {@link Parameters}, with these notable differences:
 *
 * 1. Each of the parameters can also accept an {@link AsymmetricMatcher}.
 * ```ts
 * const params4: P = [expect.anything()]; // compiles
 * ```
 * This works with nested types as well:
 * ```ts
 * type Nested = MockParameters<MockInstance<(foo: { a: number }, bar: [string]) => void>>;
 *
 * const params1: Nested = [{ foo: { a: 1 }}, ['value']]; // compiles
 * const params2: Nested = [expect.anything(), expect.anything()]; // compiles
 * const params3: Nested = [{ foo: { a: expect.anything() }}, [expect.anything()]]; // compiles
 * ```
 *
 * 2. This type works with overloaded functions (up to 15 overloads):
 * ```ts
 * function overloaded(): void;
 * function overloaded(foo: number): void;
 * function overloaded(foo: number, bar: string): void;
 * function overloaded(foo?: number, bar?: string): void {}
 *
 * type Overloaded = MockParameters<MockInstance<typeof overloaded>>;
 *
 * const params1: Overloaded = []; // compiles
 * const params2: Overloaded = [1]; // compiles
 * const params3: Overloaded = [1, 'value']; // compiles
 * const params4: Overloaded = ['value']; // error
 * const params5: Overloaded = ['value', 1]; // error
 * ```
 *
 * Mocks generated with the default `MockInstance` type will evaluate to `Array<unknown>`:
 * ```ts
 * MockParameters<MockInstance> // Array<unknown>
 * ```
 *
 * If the given type is not a `MockInstance` nor a function, this type will evaluate to `Array<unknown>`:
 * ```ts
 * MockParameters<boolean> // Array<unknown>
 * ```
 */
type MockParameters<M> =
  M extends MockInstance<infer F>
    ? FunctionParameters<F>
    : FunctionParameters<M>;

/**
 * A wrapper over `FunctionParametersInternal` which converts `never` evaluations to `Array<unknown>`.
 *
 * This is only necessary for Typescript versions prior to 5.3.
 *
 * In those versions, a function without parameters (`() => any`) is interpreted the same as an overloaded function,
 * causing `FunctionParametersInternal` to evaluate it to `[] | Array<unknown>`, which is incorrect.
 *
 * The workaround is to "catch" this edge-case in `WithAsymmetricMatchers` and interpret it as `never`.
 * However, this also affects {@link UnknownFunction} (the default generic type of `MockInstance`):
 * ```ts
 * FunctionParametersInternal<() => any> // [] | never --> [] --> correct
 * FunctionParametersInternal<UnknownFunction> // never --> incorrect
 * ```
 * An empty array is the expected type for a function without parameters,
 * so all that's left is converting `never` to `Array<unknown>` for the case of `UnknownFunction`,
 * as it needs to accept _any_ combination of parameters.
 */
type FunctionParameters<F> =
  FunctionParametersInternal<F> extends never
    ? Array<unknown>
    : FunctionParametersInternal<F>;

/**
 * 1. If the function is overloaded or has no parameters -> overloaded form (union of tuples).
 * 2. If the function has parameters -> simple form.
 * 3. else -> `never`.
 */
type FunctionParametersInternal<F> = F extends {
  (...args: infer P1): any;
  (...args: infer P2): any;
  (...args: infer P3): any;
  (...args: infer P4): any;
  (...args: infer P5): any;
  (...args: infer P6): any;
  (...args: infer P7): any;
  (...args: infer P8): any;
  (...args: infer P9): any;
  (...args: infer P10): any;
  (...args: infer P11): any;
  (...args: infer P12): any;
  (...args: infer P13): any;
  (...args: infer P14): any;
  (...args: infer P15): any;
}
  ?
      | WithAsymmetricMatchers<P1>
      | WithAsymmetricMatchers<P2>
      | WithAsymmetricMatchers<P3>
      | WithAsymmetricMatchers<P4>
      | WithAsymmetricMatchers<P5>
      | WithAsymmetricMatchers<P6>
      | WithAsymmetricMatchers<P7>
      | WithAsymmetricMatchers<P8>
      | WithAsymmetricMatchers<P9>
      | WithAsymmetricMatchers<P10>
      | WithAsymmetricMatchers<P11>
      | WithAsymmetricMatchers<P12>
      | WithAsymmetricMatchers<P13>
      | WithAsymmetricMatchers<P14>
      | WithAsymmetricMatchers<P15>
  : F extends (...args: infer P) => any
    ? WithAsymmetricMatchers<P>
    : never;

/**
 * @see FunctionParameters
 */
type WithAsymmetricMatchers<P extends Array<any>> =
  Array<unknown> extends P
    ? never
    : {[K in keyof P]: DeepAsymmetricMatcher<P[K]>};

/**
 * Replaces `T` with `T | AsymmetricMatcher`.
 *
 * If `T` is an object or an array, recursively replaces all nested types with the same logic:
 * ```ts
 * type DeepAsymmetricMatcher<boolean>; // AsymmetricMatcher | boolean
 * type DeepAsymmetricMatcher<{ foo: number }>; // AsymmetricMatcher | { foo: AsymmetricMatcher | number }
 * type DeepAsymmetricMatcher<[string]>; // AsymmetricMatcher | [AsymmetricMatcher | string]
 * ```
 */
type DeepAsymmetricMatcher<T> = T extends object
  ? AsymmetricMatcher | {[K in keyof T]: DeepAsymmetricMatcher<T[K]>}
  : AsymmetricMatcher | T;
