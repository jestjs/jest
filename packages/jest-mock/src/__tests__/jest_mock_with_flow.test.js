/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const jest: {stub: Function, getMock: Function} = global.jest;

test('stub()', () => {
  const obj = {b: () => 42, c: () => 66};
  jest.stub(obj, 'a');
  jest.stub(obj, 'b', () => 'apple');
  jest.stub(obj, 'c');

  expect(obj.b()).toBe('apple');
  expect(obj.c()).toBeUndefined();

  expect(() => jest.stub(obj)).toThrowError(/propertyName.*must be present/);
});

test('getMock()', () => {
  const obj = {a: () => 42, b: () => 99};
  jest.stub(obj, 'a');
  jest.getMock(obj.a).mockImplementation(() => 'waffles');
  expect(obj.a()).toBe('waffles');
  expect(() => jest.getMock(obj.b)).toThrowError('is not a mock');
});
