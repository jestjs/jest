/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const {
  getSnapshotData,
  getSnapshotPath,
  keyToTestName,
  saveSnapshotFile,
  testNameToKey,
  SNAPSHOT_GUIDE_LINK,
  SNAPSHOT_VERSION,
} = require('../utils');
const fs = require('fs');
const path = require('path');

const writeFileSync = fs.writeFileSync;
const readFileSync = fs.readFileSync;
beforeEach(() => {
  fs.writeFileSync = jest.fn();
  fs.readFileSync = jest.fn();
});
afterEach(() => {
  fs.writeFileSync = writeFileSync;
  fs.readFileSync = readFileSync;
});

jest.mock('jest-file-exists', () => () => true);

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

test('saveSnapshotFile() works with \r\n', () => {
  const filename = path.join(__dirname, 'remove-newlines.snap');
  const data = {
    myKey: '<div>\r\n</div>',
  };

  saveSnapshotFile(data, filename);
  expect(fs.writeFileSync)
    .toBeCalledWith(
      filename,
      `// Jest Snapshot v1, ${SNAPSHOT_GUIDE_LINK}\n\n` +
        'exports[`myKey`] = `<div>\n</div>`;\n'
    );
});

test('saveSnapshotFile() works with \r', () => {
  const filename = path.join(__dirname, 'remove-newlines.snap');
  const data = {
    myKey: '<div>\r</div>',
  };

  saveSnapshotFile(data, filename);
  expect(fs.writeFileSync)
    .toBeCalledWith(
      filename,
      `// Jest Snapshot v1, ${SNAPSHOT_GUIDE_LINK}\n\n` +
        'exports[`myKey`] = `<div>\n</div>`;\n'
    );
});

test('getSnapshotData() throws when no snapshot version', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  fs.readFileSync = jest.fn(() => 'exports[`myKey`] = `<div>\n</div>`;\n');
  const update = false;

  expect(() => getSnapshotData(filename, update)).toThrowError(
    `Stored snapshot version is outdated.\n` +
    `Expected: v${SNAPSHOT_VERSION}, but received: v0\n` +
    `Update the snapshot to remove this error.`
  );
});

test('getSnapshotData() throws for older snapshot version', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  fs.readFileSync = jest.fn(() =>
    `// Jest Snapshot v0.99, ${SNAPSHOT_GUIDE_LINK}\n\n` +
      'exports[`myKey`] = `<div>\n</div>`;\n'
  );
  const update = false;

  expect(() => getSnapshotData(filename, update)).toThrowError(
    `Stored snapshot version is outdated.\n` +
    `Expected: v${SNAPSHOT_VERSION}, but received: v0.99\n` +
    `Update the snapshot to remove this error.`
  );
});

test('getSnapshotData() does not throw for when updating', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  fs.readFileSync = jest.fn(() =>
    'exports[`myKey`] = `<div>\n</div>`;\n'
  );
  const update = true;

  expect(() => getSnapshotData(filename, update)).not.toThrow();
});

test('escaping', () => {
  const filename = path.join(__dirname, 'escaping.snap');
  const data = '"\'\\';
  saveSnapshotFile({key: data}, filename);
  const writtenData = fs.writeFileSync.mock.calls[0][1];
  expect(writtenData)
    .toBe(
      `// Jest Snapshot v1, ${SNAPSHOT_GUIDE_LINK}\n\n` +
        "exports[`key`] = `\"'\\\\`;\n"
    );

  // eslint-disable-next-line no-unused-vars
  const exports = {};
  // eslint-disable-next-line no-eval
  const readData = eval('var exports = {}; ' + writtenData + ' exports');
  expect(readData).toEqual({key: data});
  const snapshotData = readData.key;
  expect(data).toEqual(snapshotData);
});
