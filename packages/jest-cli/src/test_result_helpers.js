/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {
  AggregatedResult,
  SerializableError,
  TestResult,
} from 'types/TestResult';

export const makeEmptyAggregatedTestResult = (): AggregatedResult => {
  return {
    numFailedTestSuites: 0,
    numFailedTests: 0,
    numPassedTestSuites: 0,
    numPassedTests: 0,
    numPendingTestSuites: 0,
    numPendingTests: 0,
    numRuntimeErrorTestSuites: 0,
    numTotalTestSuites: 0,
    numTotalTests: 0,
    snapshot: {
      added: 0,
      didUpdate: false, // is set only after the full run
      failure: false,
      filesAdded: 0,
      // combines individual test results + removed files after the full run
      filesRemoved: 0,
      filesUnmatched: 0,
      filesUpdated: 0,
      matched: 0,
      total: 0,
      unchecked: 0,
      unmatched: 0,
      updated: 0,
    },
    startTime: 0,
    success: true,
    testResults: [],
    wasInterrupted: false,
  };
};

export const buildFailureTestResult = (
  testPath: string,
  err: SerializableError,
): TestResult => {
  return {
    console: null,
    displayName: '',
    failureMessage: null,
    numFailingTests: 0,
    numPassingTests: 0,
    numPendingTests: 0,
    perfStats: {
      end: 0,
      start: 0,
    },
    skipped: false,
    snapshot: {
      added: 0,
      fileDeleted: false,
      matched: 0,
      unchecked: 0,
      unmatched: 0,
      updated: 0,
    },
    sourceMaps: {},
    testExecError: err,
    testFilePath: testPath,
    testResults: [],
  };
};

// Add individual test result to an aggregated test result
export const addResult = (
  aggregatedResults: AggregatedResult,
  testResult: TestResult,
): void => {
  aggregatedResults.testResults.push(testResult);
  aggregatedResults.numTotalTests +=
    testResult.numPassingTests +
    testResult.numFailingTests +
    testResult.numPendingTests;
  aggregatedResults.numFailedTests += testResult.numFailingTests;
  aggregatedResults.numPassedTests += testResult.numPassingTests;
  aggregatedResults.numPendingTests += testResult.numPendingTests;

  if (testResult.testExecError) {
    aggregatedResults.numRuntimeErrorTestSuites++;
  }

  if (testResult.skipped) {
    aggregatedResults.numPendingTestSuites++;
  } else if (testResult.numFailingTests > 0 || testResult.testExecError) {
    aggregatedResults.numFailedTestSuites++;
  } else {
    aggregatedResults.numPassedTestSuites++;
  }

  // Snapshot data
  if (testResult.snapshot.added) {
    aggregatedResults.snapshot.filesAdded++;
  }
  if (testResult.snapshot.fileDeleted) {
    aggregatedResults.snapshot.filesRemoved++;
  }
  if (testResult.snapshot.unmatched) {
    aggregatedResults.snapshot.filesUnmatched++;
  }
  if (testResult.snapshot.updated) {
    aggregatedResults.snapshot.filesUpdated++;
  }

  aggregatedResults.snapshot.added += testResult.snapshot.added;
  aggregatedResults.snapshot.matched += testResult.snapshot.matched;
  aggregatedResults.snapshot.unchecked += testResult.snapshot.unchecked;
  aggregatedResults.snapshot.unmatched += testResult.snapshot.unmatched;
  aggregatedResults.snapshot.updated += testResult.snapshot.updated;
  aggregatedResults.snapshot.total +=
    testResult.snapshot.added +
    testResult.snapshot.matched +
    testResult.snapshot.unmatched +
    testResult.snapshot.updated;
};
