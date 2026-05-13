/**
 * @jest-environment jsdom
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type MatcherExtensionResult =
  | {
      message?: () => string;
      pass: boolean;
    }
  | boolean;

type MatcherExtension = (
  this: {isNot?: boolean},
  received: unknown,
  ...args: Array<unknown>
) => MatcherExtensionResult;

type ExpectApi = {
  (actual: unknown): {
    not: Record<string, (...args: Array<unknown>) => Promise<void> | void>;
    rejects: {
      not: Record<string, (...args: Array<unknown>) => Promise<void>>;
    } & Record<string, (...args: Array<unknown>) => Promise<void>>;
    resolves: {
      not: Record<string, (...args: Array<unknown>) => Promise<void>>;
    } & Record<string, (...args: Array<unknown>) => Promise<void>>;
  } & Record<string, (...args: Array<unknown>) => Promise<void> | void>;
  extend: (extensions: Record<string, MatcherExtension>) => void;
};

type ExpectModule = {
  createExpect: () => ExpectApi;
};

function loadModule(): ExpectModule {
  return require('../../client/tester/expect') as ExpectModule;
}

describe('createExpect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('supports scalar matchers: toBe, toBeTruthy, toBeFalsy, toBeNull, toBeDefined, toBeUndefined, toBeNaN', () => {
    const {createExpect} = loadModule();
    const expectBrowser = createExpect();

    expect(() => expectBrowser(7).toBe(7)).not.toThrow();
    expect(() => expectBrowser('x').toBeTruthy()).not.toThrow();
    expect(() => expectBrowser('').toBeFalsy()).not.toThrow();
    expect(() => expectBrowser(null).toBeNull()).not.toThrow();
    expect(() => expectBrowser(0).toBeDefined()).not.toThrow();
    expect(() => expectBrowser(undefined).toBeUndefined()).not.toThrow();
    expect(() => expectBrowser(Number.NaN).toBeNaN()).not.toThrow();

    expect(() => expectBrowser(7).toBe(8)).toThrow('toBe assertion failed');
    expect(() => expectBrowser('x').toBeFalsy()).toThrow(
      'toBeFalsy assertion failed',
    );
    expect(() => expectBrowser('not-null').toBeNull()).toThrow(
      'toBeNull assertion failed',
    );
    expect(() => expectBrowser(1).toBeNaN()).toThrow(
      'toBeNaN assertion failed',
    );
  });

  test('supports relational matchers: toBeGreaterThan, toBeGreaterThanOrEqual, toBeLessThan, toBeLessThanOrEqual', () => {
    const {createExpect} = loadModule();
    const expectBrowser = createExpect();

    expect(() => expectBrowser(10).toBeGreaterThan(9)).not.toThrow();
    expect(() => expectBrowser(10).toBeGreaterThanOrEqual(10)).not.toThrow();
    expect(() => expectBrowser(2).toBeLessThan(3)).not.toThrow();
    expect(() => expectBrowser(2).toBeLessThanOrEqual(2)).not.toThrow();

    expect(() => expectBrowser(10).toBeGreaterThan(10)).toThrow(
      'toBeGreaterThan assertion failed',
    );
    expect(() => expectBrowser(2).toBeLessThan(2)).toThrow(
      'toBeLessThan assertion failed',
    );
  });

  test('supports structure matchers: toEqual, toContain, toHaveLength, toMatch, toHaveProperty, toBeInstanceOf', () => {
    const {createExpect} = loadModule();
    const expectBrowser = createExpect();

    expect(() =>
      expectBrowser({a: 1, b: [2]}).toEqual({a: 1, b: [2]}),
    ).not.toThrow();
    expect(() => expectBrowser(['a', 'b']).toContain('b')).not.toThrow();
    expect(() => expectBrowser('abcd').toHaveLength(4)).not.toThrow();
    expect(() => expectBrowser('abc123').toMatch(/[a-z]+\d+/)).not.toThrow();
    expect(() =>
      expectBrowser({top: {leaf: 9}}).toHaveProperty('top.leaf', 9),
    ).not.toThrow();
    expect(() => expectBrowser(new Map()).toBeInstanceOf(Map)).not.toThrow();

    expect(() => expectBrowser({a: 1}).toEqual({a: 2})).toThrow(
      'toEqual assertion failed',
    );
    expect(() => expectBrowser(['a']).toContain('z')).toThrow(
      'toContain assertion failed',
    );
    expect(() => expectBrowser('abcd').toHaveLength(3)).toThrow(
      'toHaveLength assertion failed',
    );
    expect(() => expectBrowser('abc').toMatch(/\d+/)).toThrow(
      'toMatch assertion failed',
    );
    expect(() =>
      expectBrowser({top: {leaf: 9}}).toHaveProperty('top.missing'),
    ).toThrow('toHaveProperty assertion failed');
    expect(() => expectBrowser({}).toBeInstanceOf(Map)).toThrow(
      'toBeInstanceOf assertion failed',
    );
  });

  test('supports toThrow for sync function', () => {
    const {createExpect} = loadModule();
    const expectBrowser = createExpect();

    expect(() =>
      expectBrowser(() => {
        throw new Error('kaboom');
      }).toThrow('kaboom'),
    ).not.toThrow();

    expect(() =>
      expectBrowser(() => {
        return 1;
      }).toThrow(),
    ).toThrow('toThrow assertion failed');
  });

  test('supports .not inversion for core matchers', () => {
    const {createExpect} = loadModule();
    const expectBrowser = createExpect();

    expect(() => expectBrowser(1).not.toBe(2)).not.toThrow();
    expect(() => expectBrowser([1, 2]).not.toContain(3)).not.toThrow();
    expect(() => expectBrowser({a: 1}).not.toEqual({a: 2})).not.toThrow();

    expect(() => expectBrowser(1).not.toBe(1)).toThrow(
      'toBe assertion failed (inverted)',
    );
    expect(() => expectBrowser([1, 2]).not.toContain(2)).toThrow(
      'toContain assertion failed (inverted)',
    );
  });

  test('supports resolves modifier for fulfilled promise', async () => {
    const {createExpect} = loadModule();
    const expectBrowser = createExpect();

    await expect(
      expectBrowser(Promise.resolve(42)).resolves.toBe(42),
    ).resolves.toBeUndefined();
    await expect(
      expectBrowser(Promise.resolve('abc')).resolves.not.toMatch(/\d+/),
    ).resolves.toBeUndefined();

    await expect(
      expectBrowser(Promise.resolve(1)).resolves.toBe(2),
    ).rejects.toThrow('toBe assertion failed');
  });

  test('supports rejects modifier for rejected promise', async () => {
    const {createExpect} = loadModule();
    const expectBrowser = createExpect();

    await expect(
      expectBrowser(Promise.reject(new Error('bad req'))).rejects.toThrow(
        'bad req',
      ),
    ).resolves.toBeUndefined();

    await expect(
      expectBrowser(Promise.reject(new Error('bad req'))).rejects.not.toThrow(
        'other',
      ),
    ).resolves.toBeUndefined();

    await expect(
      expectBrowser(Promise.reject(new Error('x'))).rejects.toThrow('y'),
    ).rejects.toThrow('toThrow assertion failed');
  });

  test('expect.extend registers custom matcher and supports .not', () => {
    const {createExpect} = loadModule();
    const expectBrowser = createExpect();

    expectBrowser.extend({
      toBeWithinRange(received: unknown, floor: unknown, ceil: unknown) {
        const value = Number(received);
        const min = Number(floor);
        const max = Number(ceil);
        const pass = value >= min && value <= max;
        return {
          message: () =>
            `expected ${String(received)} to be within ${String(floor)}..${String(ceil)}`,
          pass,
        };
      },
    });

    expect(() => expectBrowser(5).toBeWithinRange(1, 10)).not.toThrow();
    expect(() => expectBrowser(50).not.toBeWithinRange(1, 10)).not.toThrow();

    expect(() => expectBrowser(50).toBeWithinRange(1, 10)).toThrow(
      'expected 50 to be within 1..10',
    );
    expect(() => expectBrowser(5).not.toBeWithinRange(1, 10)).toThrow(
      'expected 5 to be within 1..10',
    );
  });
});
