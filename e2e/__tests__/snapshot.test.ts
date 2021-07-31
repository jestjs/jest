/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {wrap} from 'jest-snapshot-serializer-raw';
import {extractSummary} from '../Utils';
import runJest, {json as runWithJson} from '../runJest';

const snapshotDir = path.resolve(
  __dirname,
  '../snapshot/__tests__/__snapshots__',
);
const snapshotFile = path.resolve(snapshotDir, 'snapshot.test.js.snap');
const secondSnapshotFile = path.resolve(
  snapshotDir,
  'secondSnapshot.test.js.snap',
);
const snapshotOfCopy = path.resolve(snapshotDir, 'snapshot.test_copy.js.snap');
const originalTestPath = path.resolve(
  __dirname,
  '../snapshot/__tests__/snapshot.test.js',
);

const copyOfTestPath = originalTestPath.replace(/\.js$/, '_copy.js');

const snapshotEscapeDir = path.resolve(
  __dirname,
  '../snapshot-escape/__tests__/',
);
const snapshotEscapeTestFile = path.resolve(
  snapshotEscapeDir,
  'snapshot.test.js',
);
const snapshotEscapeSnapshotDir = path.resolve(
  snapshotEscapeDir,
  '__snapshots__',
);
const snapshotEscapeFile = path.resolve(
  snapshotEscapeSnapshotDir,
  'snapshot.test.js.snap',
);
const snapshotEscapeRegexFile = path.resolve(
  snapshotEscapeSnapshotDir,
  'snapshotEscapeRegex.js.snap',
);
const snapshotEscapeSubstitutionFile = path.resolve(
  snapshotEscapeSnapshotDir,
  'snapshotEscapeSubstitution.test.js.snap',
);

const initialTestData = fs.readFileSync(snapshotEscapeTestFile, 'utf8');

const fileExists = (filePath: string) => {
  try {
    return fs.statSync(filePath).isFile();
  } catch {}
  return false;
};

describe('Snapshot', () => {
  const cleanup = () => {
    [
      snapshotFile,
      secondSnapshotFile,
      snapshotOfCopy,
      copyOfTestPath,
      snapshotEscapeFile,
      snapshotEscapeRegexFile,
      snapshotEscapeSubstitutionFile,
    ].forEach(file => {
      if (fileExists(file)) {
        fs.unlinkSync(file);
      }
    });
    if (fileExists(snapshotDir)) {
      fs.rmdirSync(snapshotDir);
    }
    if (fileExists(snapshotEscapeSnapshotDir)) {
      fs.rmdirSync(snapshotEscapeSnapshotDir);
    }

    fs.writeFileSync(snapshotEscapeTestFile, initialTestData, 'utf8');
  };

  beforeEach(cleanup);
  afterAll(cleanup);

  it('stores new snapshots on the first run', () => {
    const {exitCode, json, stderr} = runWithJson('snapshot', [
      '-w=1',
      '--ci=false',
    ]);

    expect(json.numTotalTests).toBe(5);
    expect(json.numPassedTests).toBe(5);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(0);
    expect(exitCode).toBe(0);

    const content = require(snapshotFile);
    expect(
      content['snapshot is not influenced by previous counter 1'],
    ).not.toBeUndefined();

    expect(stderr).toMatch('5 snapshots written from 2 test suites');
    expect(wrap(extractSummary(stderr).summary)).toMatchSnapshot();
  });

  it('works with escaped characters', () => {
    // Write the first snapshot
    let result = runJest('snapshot-escape', [
      '-w=1',
      '--ci=false',
      'snapshot.test.js',
    ]);
    let stderr = result.stderr;

    expect(stderr).toMatch('1 snapshot written');
    expect(result.exitCode).toBe(0);
    expect(wrap(extractSummary(stderr).summary)).toMatchSnapshot();

    // Write the second snapshot
    const testData =
      `test('escape strings two', () => expect('two: \\\'\"').` +
      `toMatchSnapshot());`;
    const newTestData = initialTestData + testData;
    fs.writeFileSync(snapshotEscapeTestFile, newTestData, 'utf8');

    result = runJest('snapshot-escape', [
      '-w=1',
      '--ci=false',
      '--updateSnapshot',
      'snapshot.test.js',
    ]);
    stderr = result.stderr;

    expect(stderr).toMatch('1 snapshot written');
    expect(wrap(extractSummary(stderr).summary)).toMatchSnapshot();
    expect(result.exitCode).toBe(0);

    // Now let's check again if everything still passes.
    // If this test doesn't pass, some snapshot data was not properly escaped.
    result = runJest('snapshot-escape', [
      '-w=1',
      '--ci=false',
      'snapshot.test.js',
    ]);
    stderr = result.stderr;

    expect(stderr).not.toMatch('Snapshot Summary');
    expect(wrap(extractSummary(stderr).summary)).toMatchSnapshot();
    expect(result.exitCode).toBe(0);
  });

  it('works with escaped regex', () => {
    // Write the first snapshot
    let result = runJest('snapshot-escape', [
      '-w=1',
      '--ci=false',
      'snapshotEscapeRegex.js',
    ]);
    let stderr = result.stderr;

    expect(stderr).toMatch('2 snapshots written from 1 test suite.');
    expect(result.exitCode).toBe(0);
    expect(wrap(extractSummary(stderr).summary)).toMatchSnapshot();

    result = runJest('snapshot-escape', [
      '-w=1',
      '--ci=false',
      'snapshotEscapeRegex.js',
    ]);
    stderr = result.stderr;

    // Make sure we aren't writing a snapshot this time which would
    // indicate that the snapshot couldn't be loaded properly.
    expect(stderr).not.toMatch('Snapshot Summary');
    expect(wrap(extractSummary(stderr).summary)).toMatchSnapshot();
    expect(result.exitCode).toBe(0);
  });

  it('works with template literal substitutions', () => {
    // Write the first snapshot
    let result = runJest('snapshot-escape', [
      '-w=1',
      '--ci=false',
      'snapshotEscapeSubstitution.test.js',
    ]);
    let stderr = result.stderr;

    expect(stderr).toMatch('1 snapshot written');
    expect(result.exitCode).toBe(0);
    expect(wrap(extractSummary(stderr).summary)).toMatchSnapshot();

    result = runJest('snapshot-escape', [
      '-w=1',
      '--ci=false',
      'snapshotEscapeSubstitution.test.js',
    ]);
    stderr = result.stderr;

    // Make sure we aren't writing a snapshot this time which would
    // indicate that the snapshot couldn't be loaded properly.
    expect(stderr).not.toMatch('1 snapshot written');
    expect(wrap(extractSummary(stderr).summary)).toMatchSnapshot();
    expect(result.exitCode).toBe(0);
  });

});
