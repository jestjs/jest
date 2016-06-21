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

jest
  .disableAutomock()
  .mock('mkdirp', () => ({sync: jest.fn()}))
  .mock('fs', () => ({
    statSync: jest.fn(() => ({isFile: () => true})),
    readFileSync: jest.fn(fileName => {
      const EXPECTED_FILE_NAME = '/foo/__tests__/__snapshots__/baz.js.snap';
      expect(fileName).toBe(EXPECTED_FILE_NAME);
      return null;
    }),
    writeFileSync: jest.fn((path, content) => {
      expect(content).toBe('exports[`foo`] = `"bar"`;\n');
    }),
  }));

const TEST_FILE = '/foo/__tests__/baz.js';
const SNAPSHOT = 'foo';
const SNAPSHOT_VALUE = 'bar';

let SnapshotFile;

describe('SnapshotFile', () => {
  beforeEach(() => {
    SnapshotFile = require('../SnapshotFile');
  });

  it('can tell if a snapshot file exists or not', () => {
    const fs = require('fs');
    const snapshotFile = SnapshotFile.forFile(TEST_FILE);
    expect(snapshotFile.fileExists()).toBe(true);
    fs.statSync.mockImplementation(() => {
      throw new Error();
    });
    expect(snapshotFile.fileExists()).toBe(false);
  });

  it('stores and retrieves snapshots', () => {
    const snapshotFile = SnapshotFile.forFile(TEST_FILE);
    snapshotFile.add(SNAPSHOT, SNAPSHOT_VALUE);
    expect(snapshotFile.get(SNAPSHOT)).toBe('"' + SNAPSHOT_VALUE + '"');
  });

  it('adds extra new lines for multi-line values', () => {
    const MULTILINE_VALUE = 'foo\nbar';
    const snapshotFile = SnapshotFile.forFile(TEST_FILE);
    snapshotFile.add(SNAPSHOT, MULTILINE_VALUE);
    expect(snapshotFile.get(SNAPSHOT)).toBe('\n"' + MULTILINE_VALUE + '"\n');
  });

  it('can tell if a snapshot file has a snapshot', () => {
    const NOT_A_SNAPSHOT = 'baz';
    const snapshotFile = SnapshotFile.forFile(TEST_FILE);
    snapshotFile.add(SNAPSHOT, SNAPSHOT_VALUE);
    expect(snapshotFile.has(SNAPSHOT)).toBe(true);
    expect(snapshotFile.has(NOT_A_SNAPSHOT)).toBe(false);
  });

  it('can tell if a snapshot matches a string', () => {
    const INCORRECT_VALUE = 'baz';
    const snapshotFile = SnapshotFile.forFile(TEST_FILE);
    snapshotFile.add(SNAPSHOT, SNAPSHOT_VALUE);
    expect(snapshotFile.matches(SNAPSHOT, SNAPSHOT_VALUE).pass).toBe(true);
    expect(snapshotFile.matches(SNAPSHOT, INCORRECT_VALUE).pass).toBe(false);
  });

  it('can replace snapshot values', () => {
    const NEW_VALUE = 'baz';
    const snapshotFile = SnapshotFile.forFile(TEST_FILE);
    snapshotFile.add(SNAPSHOT, SNAPSHOT_VALUE);
    expect(snapshotFile.matches(SNAPSHOT, SNAPSHOT_VALUE).pass).toBe(true);
    snapshotFile.add(SNAPSHOT, NEW_VALUE);
    expect(snapshotFile.matches(SNAPSHOT, NEW_VALUE).pass).toBe(true);
  });

  it('can add the same key twice', () => {
    const snapshotFile = SnapshotFile.forFile(TEST_FILE);
    snapshotFile.add(SNAPSHOT, SNAPSHOT_VALUE);
    expect(
      () => snapshotFile.add(SNAPSHOT, SNAPSHOT_VALUE),
    ).not.toThrow();
  });

  it('loads and saves file correctly', () => {
    const snapshotFile = SnapshotFile.forFile(TEST_FILE);
    snapshotFile.add(SNAPSHOT, SNAPSHOT_VALUE);
    expect(snapshotFile.get(SNAPSHOT)).toBe('"' + SNAPSHOT_VALUE + '"');
    snapshotFile.save();
  });
});
