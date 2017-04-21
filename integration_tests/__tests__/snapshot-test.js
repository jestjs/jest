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

const {extractSummary} = require('../utils');
const fs = require('fs');
const path = require('path');
const runJest = require('../runJest');

const emptyTest = 'describe("", () => {it("", () => {})})';
const snapshotDir = path.resolve(
  __dirname,
  '../snapshot/__tests__/__snapshots__',
);
const snapshotFile = path.resolve(snapshotDir, 'snapshot-test.js.snap');
const secondSnapshotFile = path.resolve(
  snapshotDir,
  'second-snapshot-test.js.snap',
);
const snapshotOfCopy = path.resolve(snapshotDir, 'snapshot-test_copy.js.snap');
const originalTestPath = path.resolve(
  __dirname,
  '../snapshot/__tests__/snapshot-test.js',
);
const originalTestContent = fs.readFileSync(originalTestPath, 'utf8');
const copyOfTestPath = originalTestPath.replace('.js', '_copy.js');

const snapshotEscapeDir = path.resolve(
  __dirname,
  '../snapshot-escape/__tests__/',
);
const snapshotEscapeTestFile = path.resolve(
  snapshotEscapeDir,
  'snapshot-test.js',
);
const snapshotEscapeSnapshotDir = path.resolve(
  snapshotEscapeDir,
  '__snapshots__',
);
const snapshotEscapeFile = path.resolve(
  snapshotEscapeSnapshotDir,
  'snapshot-test.js.snap',
);
const snapshotEscapeRegexFile = path.resolve(
  snapshotEscapeSnapshotDir,
  'snapshot-escape-regex.js.snap',
);
const snapshotEscapeSubstitutionFile = path.resolve(
  snapshotEscapeSnapshotDir,
  'snapshot-escape-substitution-test.js.snap',
);

const initialTestData = fs.readFileSync(snapshotEscapeTestFile, 'utf8');

const fileExists = filePath => {
  try {
    return fs.statSync(filePath).isFile();
  } catch (e) {}
  return false;
};
const getSnapshotOfCopy = () => {
  const exports = Object.create(null);
  // eslint-disable-next-line no-eval
  eval(fs.readFileSync(snapshotOfCopy, 'utf8'));
  return exports;
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

  it('works as expected', () => {
    const result = runJest.json('snapshot', []);
    const json = result.json;

    expect(json.numTotalTests).toBe(5);
    expect(json.numPassedTests).toBe(5);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(0);
    expect(result.status).toBe(0);

    const content = require(snapshotFile);
    expect(
      content['snapshot is not influenced by previous counter 1'],
    ).not.toBe(undefined);

    const info = result.stderr.toString();
    expect(info).toMatch('5 snapshots written in 2 test suites');
    expect(extractSummary(info).summary).toMatchSnapshot();
  });

  it('works with escaped characters', () => {
    // Write the first snapshot
    let result = runJest('snapshot-escape', ['snapshot-test.js']);
    let stderr = result.stderr.toString();

    expect(stderr).toMatch('1 snapshot written');
    expect(result.status).toBe(0);
    expect(extractSummary(stderr).summary).toMatchSnapshot();

    // Write the second snapshot
    const testData =
      `test('escape strings two', () => expect('two: \\\'\"').` +
      `toMatchSnapshot());`;
    const newTestData = initialTestData + testData;
    fs.writeFileSync(snapshotEscapeTestFile, newTestData, 'utf8');

    result = runJest('snapshot-escape', ['snapshot-test.js']);
    stderr = result.stderr.toString();

    expect(stderr).toMatch('1 snapshot written');
    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(result.status).toBe(0);

    // Now let's check again if everything still passes.
    // If this test doesn't pass, some snapshot data was not properly escaped.
    result = runJest('snapshot-escape', ['snapshot-test.js']);
    stderr = result.stderr.toString();

    expect(stderr).not.toMatch('Snapshot Summary');
    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(result.status).toBe(0);
  });

  it('works with escaped regex', () => {
    // Write the first snapshot
    let result = runJest('snapshot-escape', ['snapshot-escape-regex.js']);
    let stderr = result.stderr.toString();

    expect(stderr).toMatch('2 snapshots written in 1 test suite.');
    expect(result.status).toBe(0);
    expect(extractSummary(stderr).summary).toMatchSnapshot();

    result = runJest('snapshot-escape', ['snapshot-escape-regex.js']);
    stderr = result.stderr.toString();

    // Make sure we aren't writing a snapshot this time which would
    // indicate that the snapshot couldn't be loaded properly.
    expect(stderr).not.toMatch('Snapshot Summary');
    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(result.status).toBe(0);
  });

  it('works with template literal subsitutions', () => {
    // Write the first snapshot
    let result = runJest('snapshot-escape', [
      'snapshot-escape-substitution-test.js',
    ]);
    let stderr = result.stderr.toString();

    expect(stderr).toMatch('1 snapshot written');
    expect(result.status).toBe(0);
    expect(extractSummary(stderr).summary).toMatchSnapshot();

    result = runJest('snapshot-escape', [
      'snapshot-escape-substitution-test.js',
    ]);
    stderr = result.stderr.toString();

    // Make sure we aren't writing a snapshot this time which would
    // indicate that the snapshot couldn't be loaded properly.
    expect(stderr).not.toMatch('1 snapshot written');
    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(result.status).toBe(0);
  });

  describe('Validation', () => {
    beforeEach(() => {
      fs.writeFileSync(copyOfTestPath, originalTestContent);
    });

    it('works on subsequent runs without `-u`', () => {
      const firstRun = runJest.json('snapshot', []);

      const content = require(snapshotOfCopy);
      expect(content).not.toBe(undefined);
      const secondRun = runJest.json('snapshot', []);

      expect(firstRun.json.numTotalTests).toBe(9);
      expect(secondRun.json.numTotalTests).toBe(9);
      expect(secondRun.json.success).toBe(true);

      const infoFR = firstRun.stderr.toString();
      const infoSR = secondRun.stderr.toString();
      expect(infoFR).toMatch('9 snapshots written in 3 test suites');
      expect(infoSR).toMatch('9 passed, 9 total');
      expect(extractSummary(infoFR).summary).toMatchSnapshot();
      expect(extractSummary(infoSR).summary).toMatchSnapshot();
    });

    it('deletes the snapshot if the test suite has been removed', () => {
      const firstRun = runJest.json('snapshot', []);
      fs.unlinkSync(copyOfTestPath);

      const content = require(snapshotOfCopy);
      expect(content).not.toBe(undefined);
      const secondRun = runJest.json('snapshot', ['-u']);

      expect(firstRun.json.numTotalTests).toBe(9);
      expect(secondRun.json.numTotalTests).toBe(5);
      expect(fileExists(snapshotOfCopy)).toBe(false);

      const infoFR = firstRun.stderr.toString();
      const infoSR = secondRun.stderr.toString();
      expect(infoFR).toMatch('9 snapshots written in 3 test suites');
      expect(infoSR).toMatch('1 obsolete snapshot file removed');
      expect(extractSummary(infoFR).summary).toMatchSnapshot();
      expect(extractSummary(infoSR).summary).toMatchSnapshot();
    });

    it('deletes a snapshot when a test does removes all the snapshots', () => {
      const firstRun = runJest.json('snapshot', []);

      fs.writeFileSync(copyOfTestPath, emptyTest);
      const secondRun = runJest.json('snapshot', ['-u']);
      fs.unlinkSync(copyOfTestPath);

      expect(firstRun.json.numTotalTests).toBe(9);
      expect(secondRun.json.numTotalTests).toBe(6);

      expect(fileExists(snapshotOfCopy)).toBe(false);
      const infoFR = firstRun.stderr.toString();
      const infoSR = secondRun.stderr.toString();
      expect(infoFR).toMatch('9 snapshots written in 3 test suites');
      expect(infoSR).toMatch('1 obsolete snapshot file removed');
      expect(extractSummary(infoFR).summary).toMatchSnapshot();
      expect(extractSummary(infoSR).summary).toMatchSnapshot();
    });

    it('updates the snapshot when a test removes some snapshots', () => {
      const firstRun = runJest.json('snapshot', []);
      fs.unlinkSync(copyOfTestPath);
      const beforeRemovingSnapshot = getSnapshotOfCopy();

      fs.writeFileSync(
        copyOfTestPath,
        originalTestContent.replace(
          '.toMatchSnapshot()',
          '.not.toBe(undefined)',
        ),
      );
      const secondRun = runJest.json('snapshot', ['-u']);
      fs.unlinkSync(copyOfTestPath);

      expect(firstRun.json.numTotalTests).toBe(9);
      expect(secondRun.json.numTotalTests).toBe(9);
      expect(fileExists(snapshotOfCopy)).toBe(true);
      const afterRemovingSnapshot = getSnapshotOfCopy();

      expect(Object.keys(beforeRemovingSnapshot).length - 1).toBe(
        Object.keys(afterRemovingSnapshot).length,
      );
      const keyToCheck =
        'snapshot works with plain objects and the ' +
        'title has `escape` characters 2';
      expect(beforeRemovingSnapshot[keyToCheck]).not.toBe(undefined);
      expect(afterRemovingSnapshot[keyToCheck]).toBe(undefined);

      const infoFR = firstRun.stderr.toString();
      const infoSR = secondRun.stderr.toString();
      expect(infoFR).toMatch('9 snapshots written in 3 test suites');
      expect(extractSummary(infoFR).summary).toMatchSnapshot();
      expect(infoSR).toMatch('1 snapshot updated in 1 test suite');
      expect(infoSR).toMatch('1 obsolete snapshot removed');
      expect(extractSummary(infoSR).summary).toMatchSnapshot();
    });
  });
});
