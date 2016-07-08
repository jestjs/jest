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

const {stringify} = require('../utils');

describe('.stringify()', () => {
  [
    [[], '[]'],
    [{}, '{}'],
    [1, '1'],
    [0, '0'],
    [1.5, '1.5'],
    [null, 'null'],
    [undefined, '"undefined"'],
    ['abc', '"abc"'],
    [Symbol.for('abc'), '"Symbol(abc)"'],
    [NaN, '"NaN"'],
    [Infinity, '"Infinity"'],
    [-Infinity, '"-Infinity"'],
    [/ab\.c/gi, '"/ab\\\\.c/gi"'],
  ].forEach(([v, s]) => {
    test(stringify(v), () => {
      expect(stringify(v)).toBe(s);
    });
  });

  test('circular references', () => {
    const a = {};
    a.a = a;
    expect(stringify(a)).toBe('{"a":"[Circular]"}');
  });
});
