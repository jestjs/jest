/**
 * @jest-environment jsdom
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type DeepEqualModule = {
  deepEqual: (left: unknown, right: unknown) => boolean;
};

function loadModule(): DeepEqualModule {
  return require('../../client/tester/deep-equal') as DeepEqualModule;
}

describe('deepEqual', () => {
  test('matches primitives and plain objects', () => {
    const {deepEqual} = loadModule();

    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('x', 'x')).toBe(true);
    expect(deepEqual({a: 1, b: [2, 3]}, {a: 1, b: [2, 3]})).toBe(true);

    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual({a: 1}, {a: 2})).toBe(false);
  });

  test('handles circular references', () => {
    const {deepEqual} = loadModule();

    const left: {name: string; self?: unknown} = {name: 'node'};
    const right: {name: string; self?: unknown} = {name: 'node'};
    left.self = left;
    right.self = right;

    const mismatch: {name: string; self?: unknown} = {name: 'other'};
    mismatch.self = mismatch;

    expect(deepEqual(left, right)).toBe(true);
    expect(deepEqual(left, mismatch)).toBe(false);
  });

  test('handles Map equality', () => {
    const {deepEqual} = loadModule();

    const mapA = new Map<string, unknown>([
      ['a', 1],
      ['b', {nested: true}],
    ]);
    const mapB = new Map<string, unknown>([
      ['a', 1],
      ['b', {nested: true}],
    ]);
    const mapC = new Map<string, unknown>([
      ['a', 1],
      ['b', {nested: false}],
    ]);

    expect(deepEqual(mapA, mapB)).toBe(true);
    expect(deepEqual(mapA, mapC)).toBe(false);
  });

  test('handles Set equality', () => {
    const {deepEqual} = loadModule();

    const setA = new Set<unknown>([1, 'x', {z: 9}]);
    const setB = new Set<unknown>([1, 'x', {z: 9}]);
    const setC = new Set<unknown>([1, 'x', {z: 8}]);

    expect(deepEqual(setA, setB)).toBe(true);
    expect(deepEqual(setA, setC)).toBe(false);
  });

  test('handles Date equality', () => {
    const {deepEqual} = loadModule();

    const d1 = new Date('2025-05-01T10:20:30.000Z');
    const d2 = new Date('2025-05-01T10:20:30.000Z');
    const d3 = new Date('2025-05-01T10:20:31.000Z');

    expect(deepEqual(d1, d2)).toBe(true);
    expect(deepEqual(d1, d3)).toBe(false);
  });

  test('treats undefined values and missing keys as different', () => {
    const {deepEqual} = loadModule();

    expect(deepEqual({key: undefined}, {})).toBe(false);
    expect(deepEqual({key: undefined}, {key: undefined})).toBe(true);
  });

  test('compares symbol keys', () => {
    const {deepEqual} = loadModule();

    const token = Symbol('token');
    const left = {
      plain: 'ok',
      [token]: 1,
    };
    const right = {
      plain: 'ok',
      [token]: 1,
    };
    const mismatch = {
      plain: 'ok',
      [token]: 2,
    };

    expect(deepEqual(left, right)).toBe(true);
    expect(deepEqual(left, mismatch)).toBe(false);
  });
});
