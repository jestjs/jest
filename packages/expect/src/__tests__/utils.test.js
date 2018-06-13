/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const {stringify} = require('jest-matcher-utils');
const {emptyObject, getObjectSubset, subsetEquality} = require('../utils');

describe('getObjectSubset()', () => {
  [
    [{a: 'b', c: 'd'}, {a: 'd'}, {a: 'b'}],
    [{a: [1, 2], b: 'b'}, {a: [3, 4]}, {a: [1, 2]}],
    [[{a: 'b', c: 'd'}], [{a: 'z'}], [{a: 'b'}]],
    [[1, 2], [1, 2, 3], [1, 2]],
    [{a: [1]}, {a: [1, 2]}, {a: [1]}],
    [new Date('2015-11-30'), new Date('2016-12-30'), new Date('2015-11-30')],
  ].forEach(([object, subset, expected]) => {
    test(
      `expect(getObjectSubset(${stringify(object)}, ${stringify(subset)}))` +
        `.toEqual(${stringify(expected)})`,
      () => {
        expect(getObjectSubset(object, subset)).toEqual(expected);
      },
    );
  });
});

describe('emptyObject()', () => {
  test('matches an empty object', () => {
    expect(emptyObject({})).toBe(true);
  });

  test('does not match an object with keys', () => {
    expect(emptyObject({foo: undefined})).toBe(false);
  });

  test('does not match a non-object', () => {
    expect(emptyObject(null)).toBe(false);
    expect(emptyObject(34)).toBe(false);
  });
});

describe('subsetEquality()', () => {
  test('matching object returns true', () => {
    expect(subsetEquality({foo: 'bar'}, {foo: 'bar'})).toBe(true);
  });

  test('object without keys is undefined', () => {
    expect(subsetEquality('foo', 'bar')).toBe(undefined);
  });

  test('objects to not match', () => {
    expect(subsetEquality({foo: 'bar'}, {foo: 'baz'})).toBe(false);
    expect(subsetEquality('foo', {foo: 'baz'})).toBe(false);
  });

  test('null does not return errors', () => {
    expect(subsetEquality(null, {foo: 'bar'})).not.toBeTruthy();
  });

  test('undefined does not return errors', () => {
    expect(subsetEquality(undefined, {foo: 'bar'})).not.toBeTruthy();
  });
});
