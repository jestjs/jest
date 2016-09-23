/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const {keyToTestName, testNameToKey, getSnapshotPath} = require('../utils');
const path = require('path');

test('keyToTestName()', () => {
  expect(keyToTestName('abc cde 12')).toBe('abc cde');
  expect(keyToTestName('abc cde   12')).toBe('abc cde  ');
  expect(() => keyToTestName('abc cde')).toThrowError('count at the end');
});

test('testNameToKey', () => {
  expect(testNameToKey('abc cde', 1)).toBe('abc cde 1');
  expect(testNameToKey('abc cde ', 12)).toBe('abc cde  12');
});

test('getSnapshotPath()', () => {
  expect(getSnapshotPath(
    '/abc/cde/a-test.js',
  )).toBe(
    path.join('/abc', 'cde', '__snapshots__', 'a-test.js.snap'),
  );
});
