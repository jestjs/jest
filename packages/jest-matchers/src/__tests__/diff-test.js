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

jest.disableAutomock();

const diff = require('../diff');
const stripAnsi = require('strip-ansi');

it('diffs two objects of different type', () => {
  expect(diff(1, 'a')).toMatch(
    'comparing different types of values',
  );

  expect(diff({}, 'a')).toMatch(
    'comparing different types of values',
  );

  expect(diff([], 'a')).toMatch(
    'comparing different types of values',
  );
});

it('diffs oneline strings', () => {
  expect(stripAnsi(diff('ab', 'aa'))).toMatch('aba');
  expect(diff('a', 'a')).toBe(null);
  expect(stripAnsi(diff('123456789', '234567890'))).toMatch('1234567890');
});

it('diffs multiline strings', () => {
  const result = diff(
`line 1
line 2
line 3
line 4`,
`line 1
line  2
line 3
line 4`,
  );

  expect(stripAnsi(result)).toMatch(/\- line 2/);
  expect(stripAnsi(result)).toMatch(/\+ line {2}2/);
});

it('diffs objects', () => {
  const result = stripAnsi(diff({a: {b: {c: 5}}}, {a: {b: {c: 6}}}));
  expect(result).toMatch(/\-\s+\"c\"\: 5/);
  expect(result).toMatch(/\+\s+\"c\"\: 6/);
});

it('diffs null and undefined', () => {
  expect(diff(null, {})).toMatch('null');
  expect(diff(undefined, undefined)).toBe(null);
});
