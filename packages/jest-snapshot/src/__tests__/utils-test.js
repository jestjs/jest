/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const {
  getSnapshotPath,
  keyToTestName,
  saveSnapshotFile,
  testNameToKey,
} = require('../utils');
const fs = require('fs');
const path = require('path');

const writeFileSync = fs.writeFileSync;
beforeEach(() => fs.writeFileSync = jest.fn());
afterEach(() => fs.writeFileSync = writeFileSync);

test('keyToTestName()', () => {
  expect(keyToTestName('abc cde 12')).toBe('abc cde');
  expect(keyToTestName('abc cde   12')).toBe('abc cde  ');
  expect(() => keyToTestName('abc cde'))
    .toThrowError('Snapshot keys must end with a number.');
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

test('saveSnapshotFile()', () => {
  const filename = path.join(__dirname, 'remove-newlines.snap');
  const data = {
    myKey: '<div>\r\n</div>',
  };

  saveSnapshotFile(data, filename);
  expect(fs.writeFileSync)
    .toBeCalledWith(filename, 'exports[`myKey`] = `<div>\n</div>`;\n');
});

test('escaping', () => {
  const filename = path.join(__dirname, 'escaping.snap');
  const data = '"\'\\';
  saveSnapshotFile({key: data}, filename);
  const writtenData = fs.writeFileSync.mock.calls[0][1];
  expect(writtenData).toBe("exports[`key`] = `\"'\\\\`;\n");

  // eslint-disable-next-line no-unused-vars
  const exports = {};
  // eslint-disable-next-line no-eval
  const readData = eval('var exports = {}; ' + writtenData + ' exports');
  expect(readData).toEqual({key: data});
  const snapshotData = readData.key;
  expect(data).toEqual(snapshotData);
});
