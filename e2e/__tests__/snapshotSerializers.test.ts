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

const runAndAssert = () => {
  const {exitCode, json} = runWithJson('snapshot-serializers', [
    '-w=1',
    '--ci=false',
    '--no-cache',
  ]);
  expect(json.numTotalTests).toBe(9);
  expect(json.numPassedTests).toBe(9);
  expect(json.numFailedTests).toBe(0);
  expect(json.numPendingTests).toBe(0);
  expect(exitCode).toBe(0);
};

describe('Snapshot serializers', () => {
  beforeEach(() => {
    cleanup(snapshotsDir);
    cleanup(esmSnapshotsDir);
  });
  afterEach(() => {
    cleanup(snapshotsDir);
    cleanup(esmSnapshotsDir);
  });

  it('renders snapshot', () => {
    runAndAssert();
    const snapshot = require(snapshotPath);
    expect(snapshot).toMatchSnapshot();
  });

  it('compares snapshots correctly', () => {
    // run twice, second run compares result with snapshot from first run
    runAndAssert();
    runAndAssert();
  });

  it('renders snapshots with an ESM serializer from config', () => {
    const {exitCode, json} = runWithJson('snapshot-serializers-esm', [
      '-w=1',
      '--ci=false',
      '--no-cache',
    ]);
    expect(json.numTotalTests).toBe(1);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(0);
    expect(exitCode).toBe(0);

    const snapshot = require(esmSnapshotPath);
    expect(snapshot).toMatchSnapshot();
  });

  it('renders snapshots with an ESM serializer from config using jasmine2', () => {
    const {exitCode, json} = runWithJson('snapshot-serializers-esm', [
      '-w=1',
      '--ci=false',
      '--no-cache',
      '--testRunner=jest-jasmine2',
    ]);
    expect(json.numTotalTests).toBe(1);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(0);
    expect(exitCode).toBe(0);

    const snapshot = require(esmSnapshotPath);
    expect(snapshot).toMatchSnapshot();
  });
});
