/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {cleanup} from '../Utils';
import {json as runWithJson} from '../runJest';

const testDir = path.resolve(__dirname, '../snapshot-serializers');
const snapshotsDir = path.resolve(testDir, '__tests__/__snapshots__');
const snapshotPath = path.resolve(snapshotsDir, 'snapshot.test.js.snap');

const esmTestDir = path.resolve(__dirname, '../snapshot-serializers-esm');
const esmSnapshotsDir = path.resolve(esmTestDir, '__tests__/__snapshots__');
const esmSnapshotPath = path.resolve(esmSnapshotsDir, 'snapshot.test.js.snap');

const runAndAssert = (directory: string, expectedTests: number) => {
  const {exitCode, json} = runWithJson(directory, [
    '-w=1',
    '--ci=false',
    '--no-cache',
  ]);
  expect(json.numTotalTests).toBe(expectedTests);
  expect(json.numPassedTests).toBe(expectedTests);
  expect(json.numFailedTests).toBe(0);
  expect(json.numPendingTests).toBe(0);
  expect(exitCode).toBe(0);
};

describe('Snapshot serializers', () => {
  beforeEach(() => cleanup(snapshotsDir));
  afterEach(() => cleanup(snapshotsDir));

  it('renders snapshot', () => {
    runAndAssert('snapshot-serializers', 9);
    const snapshot = require(snapshotPath);
    expect(snapshot).toMatchSnapshot();
  });

  it('compares snapshots correctly', () => {
    // run twice, second run compares result with snapshot from first run
    runAndAssert('snapshot-serializers', 9);
    runAndAssert('snapshot-serializers', 9);
  });
});

describe('Snapshot serializers written in ESM', () => {
  beforeEach(() => cleanup(esmSnapshotsDir));
  afterEach(() => cleanup(esmSnapshotsDir));

  it('renders snapshot', () => {
    runAndAssert('snapshot-serializers-esm', 2);
    const snapshot = require(esmSnapshotPath);
    expect(snapshot).toMatchSnapshot();
  });

  it('compares snapshots correctly', () => {
    runAndAssert('snapshot-serializers-esm', 2);
    runAndAssert('snapshot-serializers-esm', 2);
  });
});
