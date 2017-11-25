/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import deepCyclicCopy from '../deep_cyclic_copy';

it('returns the same value for primitive or function values', () => {
  const fn = () => {};

  expect(deepCyclicCopy(undefined)).toBe(undefined);
  expect(deepCyclicCopy(null)).toBe(null);
  expect(deepCyclicCopy(true)).toBe(true);
  expect(deepCyclicCopy(42)).toBe(42);
  expect(Number.isNaN(deepCyclicCopy(NaN))).toBe(true);
  expect(deepCyclicCopy('foo')).toBe('foo');
  expect(deepCyclicCopy(fn)).toBe(fn);
});

it('does not execute getters/setters, but copies them', () => {
  const fn = jest.fn();
  const obj = {
    get foo() {
      fn();
    },
  };
  const copy = deepCyclicCopy(obj);

  expect(Object.getOwnPropertyDescriptor(copy, 'foo')).toBeDefined();
  expect(fn).not.toBeCalled();
});

it('copies symbols', () => {
  const symbol = Symbol('foo');
  const obj = {[symbol]: 42};

  expect(deepCyclicCopy(obj)[symbol]).toBe(42);
});

it('copies arrays as array objects', () => {
  const array = [null, 42, 'foo', 'bar', [], {}];

  expect(deepCyclicCopy(array)).toEqual(array);
  expect(Array.isArray(deepCyclicCopy(array))).toBe(true);
});

it('handles cyclic dependencies', () => {
  const cyclic = {a: 42, subcycle: {}};

  cyclic.subcycle.baz = cyclic;
  cyclic.bar = cyclic;

  expect(() => deepCyclicCopy(cyclic)).not.toThrow();

  const copy = deepCyclicCopy(cyclic);

  expect(copy.a).toBe(42);
  expect(copy.bar).toEqual(copy);
  expect(copy.subcycle.baz).toEqual(copy);
});

it('uses the blacklist to avoid copying properties on the first level', () => {
  const obj = {
    blacklisted: 41,
    subObj: {
      blacklisted: 42,
    },
  };

  expect(deepCyclicCopy(obj, new Set(['blacklisted']))).toEqual({
    subObj: {
      blacklisted: 42,
    },
  });
});
