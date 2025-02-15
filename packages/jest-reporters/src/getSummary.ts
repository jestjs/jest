/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pc from 'picocolors';
import type {AggregatedResult, Test, TestCaseResult} from '@jest/test-result';
import {formatTime, pluralize} from 'jest-util';
import type {SummaryOptions} from './types';

export const PROGRESS_BAR_WIDTH = 40;

function getValuesCurrentTestCases(
  currentTestCases: Array<{test: Test; testCaseResult: TestCaseResult}> = [],
) {
  let numFailingTests = 0;
  let numPassingTests = 0;
  let numPendingTests = 0;
  let numTodoTests = 0;
  let numTotalTests = 0;
  for (const testCase of currentTestCases) {
    switch (testCase.testCaseResult.status) {
      case 'failed': {
        numFailingTests++;
        break;
      }
      case 'passed': {
        numPassingTests++;
        break;
      }
      case 'skipped': {
        numPendingTests++;
        break;
      }
      case 'todo': {
        numTodoTests++;
        break;
      }
    }
    numTotalTests++;
  }

  return {
    numFailingTests,
    numPassingTests,
    numPendingTests,
    numTodoTests,
    numTotalTests,
  };
}

function renderTime(runTime: number, estimatedTime: number, width: number) {
  // If we are more than one second over the estimated time, highlight it.
  const renderedTime =
    estimatedTime && runTime >= estimatedTime + 1
      ? pc.bold(pc.yellow(formatTime(runTime, 0)))
      : formatTime(runTime, 0);
  let time = `${pc.bold('Time:')}        ${renderedTime}`;
  if (runTime < estimatedTime) {
    time += `, estimated ${formatTime(estimatedTime, 0)}`;
  }

  // Only show a progress bar if the test run is actually going to take
  // some time.
  if (estimatedTime > 2 && runTime < estimatedTime && width) {
    const availableWidth = Math.min(PROGRESS_BAR_WIDTH, width);
    const length = Math.min(
      Math.floor((runTime / estimatedTime) * availableWidth),
      availableWidth,
    );
    if (availableWidth >= 2) {
      time += `\n${pc.green('█').repeat(length)}${pc
        .white('█')
        .repeat(availableWidth - length)}`;
    }
  }
  return time;
}

export default function getSummary(
  aggregatedResults: AggregatedResult,
  options?: SummaryOptions,
): string {
  let runTime = (Date.now() - aggregatedResults.startTime) / 1000;
  if (options && options.roundTime) {
    runTime = Math.floor(runTime);
  }

  const valuesForCurrentTestCases = getValuesCurrentTestCases(
    options?.currentTestCases,
  );

  const estimatedTime = (options && options.estimatedTime) || 0;
  const snapshotResults = aggregatedResults.snapshot;
  const snapshotsAdded = snapshotResults.added;
  const snapshotsFailed = snapshotResults.unmatched;
  const snapshotsOutdated = snapshotResults.unchecked;
  const snapshotsFilesRemoved = snapshotResults.filesRemoved;
  const snapshotsDidUpdate = snapshotResults.didUpdate;
  const snapshotsPassed = snapshotResults.matched;
  const snapshotsTotal = snapshotResults.total;
  const snapshotsUpdated = snapshotResults.updated;
  const suitesFailed = aggregatedResults.numFailedTestSuites;
  const suitesPassed = aggregatedResults.numPassedTestSuites;
  const suitesPending = aggregatedResults.numPendingTestSuites;
  const suitesRun = suitesFailed + suitesPassed;
  const suitesTotal = aggregatedResults.numTotalTestSuites;
  const testsFailed = aggregatedResults.numFailedTests;
  const testsPassed = aggregatedResults.numPassedTests;
  const testsPending = aggregatedResults.numPendingTests;
  const testsTodo = aggregatedResults.numTodoTests;
  const testsTotal = aggregatedResults.numTotalTests;
  const width = (options && options.width) || 0;

  const optionalLines: Array<string> = [];

  if (options?.showSeed === true) {
    const {seed} = options;
    if (seed === undefined) {
      throw new Error('Attempted to display seed but seed value is undefined');
    }
    optionalLines.push(`${pc.bold('Seed:        ') + seed}`);
  }

  const suites = `${
    pc.bold('Test Suites: ') +
    (suitesFailed ? `${pc.bold(pc.red(`${suitesFailed} failed`))}, ` : '') +
    (suitesPending
      ? `${pc.bold(pc.yellow(`${suitesPending} skipped`))}, `
      : '') +
    (suitesPassed ? `${pc.bold(pc.green(`${suitesPassed} passed`))}, ` : '') +
    (suitesRun === suitesTotal ? suitesTotal : `${suitesRun} of ${suitesTotal}`)
  } total`;

  const updatedTestsFailed =
    testsFailed + valuesForCurrentTestCases.numFailingTests;
  const updatedTestsPending =
    testsPending + valuesForCurrentTestCases.numPendingTests;
  const updatedTestsTodo = testsTodo + valuesForCurrentTestCases.numTodoTests;
  const updatedTestsPassed =
    testsPassed + valuesForCurrentTestCases.numPassingTests;
  const updatedTestsTotal =
    testsTotal + valuesForCurrentTestCases.numTotalTests;

  const tests = `${
    pc.bold('Tests:       ') +
    (updatedTestsFailed > 0
      ? `${pc.bold(pc.red(`${updatedTestsFailed} failed`))}, `
      : '') +
    (updatedTestsPending > 0
      ? `${pc.bold(pc.yellow(`${updatedTestsPending} skipped`))}, `
      : '') +
    (updatedTestsTodo > 0
      ? `${pc.bold(pc.magenta(`${updatedTestsTodo} todo`))}, `
      : '') +
    (updatedTestsPassed > 0
      ? `${pc.bold(pc.green(`${updatedTestsPassed} passed`))}, `
      : '')
  }${updatedTestsTotal} total`;

  const snapshots = `${
    pc.bold('Snapshots:   ') +
    (snapshotsFailed
      ? `${pc.bold(pc.red(`${snapshotsFailed} failed`))}, `
      : '') +
    (snapshotsOutdated && !snapshotsDidUpdate
      ? `${pc.bold(pc.yellow(`${snapshotsOutdated} obsolete`))}, `
      : '') +
    (snapshotsOutdated && snapshotsDidUpdate
      ? `${pc.bold(pc.green(`${snapshotsOutdated} removed`))}, `
      : '') +
    (snapshotsFilesRemoved && !snapshotsDidUpdate
      ? `${pc.bold(
          pc.yellow(`${pluralize('file', snapshotsFilesRemoved)} obsolete`),
        )}, `
      : '') +
    (snapshotsFilesRemoved && snapshotsDidUpdate
      ? `${pc.bold(
          pc.green(`${pluralize('file', snapshotsFilesRemoved)} removed`),
        )}, `
      : '') +
    (snapshotsUpdated
      ? `${pc.bold(pc.green(`${snapshotsUpdated} updated`))}, `
      : '') +
    (snapshotsAdded
      ? `${pc.bold(pc.green(`${snapshotsAdded} written`))}, `
      : '') +
    (snapshotsPassed
      ? `${pc.bold(pc.green(`${snapshotsPassed} passed`))}, `
      : '')
  }${snapshotsTotal} total`;

  const time = renderTime(runTime, estimatedTime, width);

  return [...optionalLines, suites, tests, snapshots, time].join('\n');
}
