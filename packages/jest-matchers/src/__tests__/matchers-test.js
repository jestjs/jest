/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

const jestExpect = require('../').expect;

describe('toBe()', () => {
  it('does not throw', () => {
    jestExpect('a').not.toBe('b');
    jestExpect('a').toBe('a');
    jestExpect(1).not.toBe(2);
    jestExpect(1).toBe(1);
    jestExpect(null).not.toBe(undefined);
    jestExpect(null).toBe(null);
    jestExpect(undefined).toBe(undefined);
  });

  [[1, 2], [true, false], [{}, {}], [[], []], [null, undefined]].forEach(v => {
    it(`fails for: ${JSON.stringify(v[0])} and ${JSON.stringify(v[1])}`, () => {
      const fn = () => jestExpect(v[0]).toBe(v[1]);
      expect(fn).toThrowError(/expected.*to equal.*===.*/);
    });
  });

  [false, 1, 'a', undefined, null, {}, []].forEach(v => {
    it(`fails for '${JSON.stringify(v)}' with '.not'`, () => {
      const fn = () => jestExpect(v).not.toBe(v);
      expect(fn).toThrowError(/expected.*to not equal.*!==.*/);
    });
  });

  it('does not crash on circular references', () => {
    const obj = {};
    obj.circular = obj;
    expect(() => jestExpect(obj).toBe({})).toThrowError(
      /expected.*circular.*\[Circular\].*to equal.*/,
    );
  });
});
