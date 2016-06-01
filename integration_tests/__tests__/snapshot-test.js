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

const fs = require('fs');
const path = require('path');
const runJest = require('../runJest');

const snapshotDir =
  path.resolve(__dirname, '../snapshot/__tests__/__snapshots__');
const snapshotFile = path.resolve(snapshotDir, 'snapshot-test.js.snap');
const secondSnapshotFile = path.resolve(
  snapshotDir,
  'second-snapshot-test.js.snap'
);
const snapshotCopy = path.resolve(snapshotDir, 'snapshot_copy.js.snap');
const fileExists = filePath => {
  try {
    fs.accessSync(filePath, fs.R_OK);
    return true;
  } catch (e) {}
  return false;
};

describe('Snapshot', () => {

  afterEach(() => {
    fs.unlinkSync(snapshotFile);
    fs.unlinkSync(secondSnapshotFile);
    fs.rmdirSync(snapshotDir);
  });

  it('works as expected', () => {
    const result = runJest.json('snapshot', []);
    const json = result.json;

    expect(json.numTotalTests).toBe(4);
    expect(json.numPassedTests).toBe(4);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(0);
    expect(result.status).toBe(0);

    const content = require(snapshotFile);
    expect(
      content['snapshot is not influenced by previous counter 0']
    ).not.toBe(undefined);
  });

  describe('validates existance of snapshots correctly', () => {
    const pathToOriginal = path.resolve(
      __dirname,
      '../snapshot/__tests__/snapshot.js'
    );
    const originalContent = String(fs.readFileSync(pathToOriginal));
    const pathToCopy = pathToOriginal.replace('.js', '_copy.js');

    it('delete the snapshot if the test file has been removed', () => {
      fs.writeFileSync(pathToCopy, originalContent);
      const firstRun = runJest.json('snapshot', []);
      fs.unlinkSync(pathToCopy);

      const secondRun = runJest.json('snapshot', []);

      expect(firstRun.json.numTotalTests).toBe(6);
      expect(secondRun.json.numTotalTests).toBe(3);
      expect(fileExists(snapshotCopy)).toBe(false);
    });

    it('delete the snapshot when a test does removes all the snapshots', () => {
      fs.writeFileSync(pathToCopy, originalContent);
      const firstRun = runJest.json('snapshot', []);
      fs.unlinkSync(pathToCopy);

      fs.writeFileSync(pathToCopy, '');
      const secondRun = runJest.json('snapshot', []);
      fs.unlinkSync(pathToCopy);

      expect(firstRun.json.numTotalTests).toBe(6);
      expect(secondRun.json.numTotalTests).toBe(3);
      expect(fileExists(snapshotCopy)).toBe(false);
    });

    it('updates the snapshot when a test removes some snapshots', () => {
      fs.writeFileSync(pathToCopy, originalContent);
      const firstRun = runJest.json('snapshot', []);
      fs.unlinkSync(pathToCopy);

      const beforeRemovingSnapshot = JSON.parse(fs.readFileSync(snapshotCopy));
      const changedContent = originalContent.replace(
        '.toMatchSnapshot()',
        '.not.toBe(undefined)'
      );
      fs.writeFileSync(pathToCopy, changedContent);
      const secondRun = runJest.json('snapshot', []);
      fs.unlinkSync(pathToCopy);

      expect(firstRun.json.numTotalTests).toBe(6);
      expect(secondRun.json.numTotalTests).toBe(6);
      expect(fileExists(snapshotCopy)).toBe(true);

      const afterRemovingSnapshot = JSON.parse(fs.readFileSync(snapshotCopy));
      fs.unlinkSync(snapshotCopy);

      expect(
        Object.keys(beforeRemovingSnapshot).length
      ).toBe(
        Object.keys(afterRemovingSnapshot).length + 1
      );
      expect(
        beforeRemovingSnapshot['snapshot works with plain objects 1']
      ).not.toBe(undefined);
      expect(
        afterRemovingSnapshot['snapshot works with plain objects 1']
      ).toBe(undefined);
    });
  });

});
