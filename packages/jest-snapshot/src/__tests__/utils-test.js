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
  SNAPSHOT_VERSION_WARNING,
} = require('../utils');
const chalk = require('chalk');
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
    chalk.red(
      `${chalk.bold('Outdated snapshot')}: No snapshot header found. ` +
      `Jest 19 introduced versioned snapshots to ensure all users of ` +
      `a project are using the same version of Jest. ` +
      `Please update all snapshots during this upgrade of Jest.\n\n`
    ) +
    SNAPSHOT_VERSION_WARNING
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
    chalk.red(
      `${chalk.red.bold('Outdated snapshot')}: The version of the snapshot ` +
      `file associated with this test is outdated. The snapshot file ` +
      `version ensures that all users of a project are using ` +
      `the same version of Jest. ` +
      `Please update all snapshots during this upgrade of Jest.\n\n`
    ) +
    `Expected: v${SNAPSHOT_VERSION}\n` +
    `Received: v0.99\n\n` +
    SNAPSHOT_VERSION_WARNING
  );
});

test('getSnapshotData() throws for newer snapshot version', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  fs.readFileSync = jest.fn(() =>
    `// Jest Snapshot v2, ${SNAPSHOT_GUIDE_LINK}\n\n` +
      'exports[`myKey`] = `<div>\n</div>`;\n'
  );
  const update = false;

  expect(() => getSnapshotData(filename, update)).toThrowError(
    chalk.red(
      `${chalk.red.bold('Outdated Jest version')}: The version of this ` +
      `snapshot file indicates that this project is meant to be used ` +
      `with a newer version of Jest. ` +
      `The snapshot file version ensures that all users of a project ` +
      `are using the same version of Jest. ` +
      `Please update your version of Jest and re-run the tests.\n\n`
    ) +
    `Expected: v${SNAPSHOT_VERSION}\n` +
    `Received: v2`
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

test('getSnapshotData() marks invalid snapshot dirty when updating', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  fs.readFileSync = jest.fn(() =>
    'exports[`myKey`] = `<div>\n</div>`;\n'
  );
  const update = true;

  expect(getSnapshotData(filename, update)).toMatchObject({dirty: true});
});

test('getSnapshotData() marks valid snapshot not dirty when updating', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  fs.readFileSync = jest.fn(() =>
    `// Jest Snapshot v${SNAPSHOT_VERSION}, ${SNAPSHOT_GUIDE_LINK}\n\n` +
    'exports[`myKey`] = `<div>\n</div>`;\n'
  );
  const update = true;

  expect(getSnapshotData(filename, update)).toMatchObject({dirty: false});
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
