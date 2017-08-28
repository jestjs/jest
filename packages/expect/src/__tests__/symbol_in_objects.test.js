/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

describe('Symbol in objects', () => {
  test('should compare objects with Symbol keys', () => {
    const sym = Symbol('foo');
    const obj1 = {[sym]: 'one'};
    const obj2 = {[sym]: 'two'};
    const obj3 = {[sym]: 'one'};

    expect(obj1).toEqual(obj3);
    expect(obj1).not.toEqual(obj2);
  });

  test('should compare objects with mixed keys and Symbol', () => {
    const sym = Symbol('foo2');
    const obj1 = {foo: 2, [sym]: 'one'};
    const obj2 = {foo: 2, [sym]: 'two'};
    const obj3 = {foo: 2, [sym]: 'one'};

    expect(obj1).toEqual(obj3);
    expect(obj1).not.toEqual(obj2);
  });

  test('should compare objects with different Symbol keys', () => {
    const sym = Symbol('foo');
    const sym2 = Symbol('foo');
    const obj1 = {[sym]: 'one'};
    const obj2 = {[sym2]: 'one'};
    const obj3 = {[sym]: 'one'};

    expect(obj1).toEqual(obj3);
    expect(obj1).not.toEqual(obj2);
  });
});
