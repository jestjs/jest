/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Config, Path} from 'types/Config';
import type {AggregatedResult} from 'types/TestResult';

const chalk = require('chalk');
const path = require('path');

type SummaryOptions = {
  currentSuites?: boolean,
  estimatedTime?: number,
  roundTime?: boolean,
  width?: number,
};

const formatTestPath = (config: Config, testPath: Path) => {
  const {dirname, basename} = relativePath(config, testPath);
  return chalk.gray(dirname + path.sep) + chalk.bold(basename);
};

const relativePath = (config: Config, testPath: Path) => {
  testPath = path.relative(config.rootDir, testPath);
  const dirname = path.dirname(testPath);
  const basename = path.basename(testPath);
  return {dirname, basename};
};

const pluralize = (word: string, count: number) =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

const getSummary = (
  aggregatedResults: AggregatedResult,
  options?: SummaryOptions,
) => {
  let runTime = (Date.now() - aggregatedResults.startTime) / 1000;
  if (options && options.roundTime) {
    runTime = Math.floor(runTime);
  }
  const estimatedTime = (options && options.estimatedTime) || 0;
  const snapshotResults = aggregatedResults.snapshot;

  let suites = chalk.bold('Test Suites: ');
  const suitesFailed = aggregatedResults.numFailedTestSuites;
  const suitesPassed = aggregatedResults.numPassedTestSuites;
  const suitesTotal = aggregatedResults.numTotalTestSuites;

  if (suitesFailed) {
    suites += chalk.bold.red(`${suitesFailed} failed`) + ', ';
  }

  suites += chalk.bold.green(`${suitesPassed} passed`);
  suites += ` (${suitesTotal} total)`;

  let tests = chalk.bold('Tests:       ');
  const testsPassed = aggregatedResults.numPassedTests;
  const testsFailed = aggregatedResults.numFailedTests;
  const testsTotal = aggregatedResults.numTotalTests;

  if (testsFailed) {
    tests += chalk.bold.red(`${testsFailed} failed`) + ', ';
  }

  tests += chalk.bold.green(`${testsPassed} passed`);
  tests += ` (${testsTotal} total)`;

  let snapshots = chalk.bold('Snapshots:   ');
  const snapshotsPassed = snapshotResults.matched;
  const snapshotsFailed = snapshotResults.unmatched;
  const snapshotsUpdated = snapshotResults.updated;
  const snapshotsAdded = snapshotResults.added;
  const snapshotsTotal = snapshotResults.total;

  if (snapshotsFailed) {
    snapshots += chalk.bold.red(`${snapshotsFailed} failed`) + ', ';
  }

  if (snapshotsUpdated) {
    snapshots += chalk.bold.green(`${snapshotsUpdated} updated`) + ', ';
  }

  if (snapshotsAdded) {
    snapshots += chalk.bold.green(`${snapshotsAdded} added`) + ', ';
  }

  snapshots += chalk.bold.green(`${snapshotsPassed} passed`);
  snapshots += ` (${snapshotsTotal} total)`;

  let time = chalk.bold(`Time:`) + `        ${runTime}s`;
  if (estimatedTime) {
    time += ` (${estimatedTime}s estimated)`;
  }

  return [suites, tests, snapshots, time].join('\n');
};

// wrap a string that contains ANSI escape sequences. ANSI escape sequences
// do not add to the string length.
const wrapAnsiString = (string: string, width: number) => {
  const ANSI_REGEXP = /[\u001b\u009b]\[\d{1,2}m/g;
  const tokens = [];
  let lastIndex = 0;
  let match;

  while (match = ANSI_REGEXP.exec(string)) {
    const ansi = match[0];
    const index = match['index'];
    if (index != lastIndex) {
      tokens.push(['string', string.slice(lastIndex, index)]);
    }
    tokens.push(['ansi', ansi]);
    lastIndex = index + ansi.length;
  }

  if (lastIndex != string.length - 1) {
    tokens.push(['string', string.slice(lastIndex, string.length)]);
  }

  let lastLineLength = 0;

  return tokens.reduce(
    (lines, [kind, token]) => {
      if (kind === 'string') {
        if (lastLineLength + token.length > width) {

          while (token.length) {
            const chunk = token.slice(0, width - lastLineLength);
            const remaining = token.slice(width - lastLineLength, token.length);
            lines[lines.length - 1] += chunk;
            lastLineLength += chunk.length;
            token = remaining;
            if (token.length) {
              lines.push('');
              lastLineLength = 0;
            }
          }
        } else {
          lines[lines.length - 1] += token;
          lastLineLength += token.length;
        }
      } else {
        lines[lines.length - 1] += token;
      }

      return lines;
    },
    [''],
  ).join('\n');
};

module.exports = {
  formatTestPath,
  getSummary,
  pluralize,
  relativePath,
  wrapAnsiString,
};
