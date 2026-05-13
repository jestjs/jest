/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {deleteProperties, protectProperties} from '../garbage-collection-utils';

const omit = require('lodash').omit;

const DELETION_MODE_SYMBOL = Symbol.for('$$jest-deletion-mode');

it('protection symbol doesnt leak', () => {
  const obj = {a: 1, b: 2};
  protectProperties(obj);
  expect(obj).toStrictEqual(obj);
  expect(omit(obj, 'a')).toStrictEqual({b: 2});
  expect({b: 2}).toStrictEqual(omit(obj, 'a'));
});

describe('soft deletion of data properties', () => {
  let originalMode: unknown;

  beforeEach(() => {
    originalMode = Reflect.get(globalThis, DELETION_MODE_SYMBOL);
    Reflect.set(globalThis, DELETION_MODE_SYMBOL, 'soft');
  });

  afterEach(() => {
    Reflect.set(globalThis, DELETION_MODE_SYMBOL, originalMode);
  });

  it('does not recurse infinitely when writing to a soft-deleted data property', () => {
    const obj: {foo: string} = {foo: 'bar'};
    deleteProperties(obj);
    expect(() => {
      obj.foo = 'baz';
    }).not.toThrow();
  });

  it('reflects the updated value after writing to a soft-deleted data property', () => {
    const obj: {foo: string} = {foo: 'bar'};
    deleteProperties(obj);
    obj.foo = 'baz';
    expect(obj.foo).toBe('baz');
  });
});
