/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

const getType = require('..');

describe('.getType()', () => {
  test('null', () => expect(getType(null)).toBe('null'));
  test('undefined', () => expect(getType(undefined)).toBe('undefined'));
  test('object', () => expect(getType({})).toBe('object'));
  test('array', () => expect(getType([])).toBe('array'));
  test('number', () => expect(getType(1)).toBe('number'));
  test('string', () => expect(getType('oi')).toBe('string'));
  test('function', () => expect(getType(() => {})).toBe('function'));
  test('boolean', () => expect(getType(true)).toBe('boolean'));
  test('symbol', () => expect(getType(Symbol.for('a'))).toBe('symbol'));
  test('regexp', () => expect(getType(/abc/)).toBe('regexp'));
  test('map', () => expect(getType(new Map())).toBe('map'));
  test('set', () => expect(getType(new Set())).toBe('set'));
});
