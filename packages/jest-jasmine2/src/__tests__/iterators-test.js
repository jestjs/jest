/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

describe('compare iterables correctly', () => {

  it('works for arrays', () => {
    const obj = [1, {}, []];

    expect(obj).toEqual(obj);
    expect([1, 2, 3]).toEqual([1, 2, 3]);
    expect([1]).not.toEqual([2]);
    expect([1, 2, 3]).not.toEqual([1, 2]);
    expect([1, 2, 3]).not.toEqual([1, 2, 3, 4]);
  });

  it('works for custom iterables', () => {
    const iterable = {
      0: 'a',
      1: 'b',
      2: 'c',
      length: 3,
      [Symbol.iterator]: Array.prototype[Symbol.iterator],
    };

    expect(iterable).toEqual(['a', 'b', 'c']);
    expect(iterable).not.toEqual(['a', 'b']);
    expect(iterable).not.toEqual(['a', 'b', 'c', 'd']);
  });

  it('works for Sets', () => {
    const numbers = [1, 2, 3, 4];
    const setOfNumbers = new Set(numbers);

    expect(setOfNumbers).not.toEqual(new Set());
    expect(setOfNumbers).not.toBe(numbers);
    expect(setOfNumbers).not.toEqual([1, 2, 3]);
    expect(setOfNumbers).toEqual(numbers);
  });

  it('works for Maps', () => {
    const keyValuePairs = [['key1', 'value1'], ['key2', 'value2']];
    const map = new Map(keyValuePairs);

    expect(map).not.toBe(keyValuePairs);
    expect(map).toEqual(keyValuePairs);
  });

});
