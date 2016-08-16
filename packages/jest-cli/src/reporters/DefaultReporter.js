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

import type {AggregatedResult, TestResult} from 'types/TestResult';
import type {Config} from 'types/Config';

const BaseReporter = require('./BaseReporter');

const chalk = require('chalk');
const getResultHeader = require('./getResultHeader');
const getConsoleOutput = require('./getConsoleOutput');

const RUNNING_TEST_COLOR = chalk.bold.gray;
const TITLE_BULLET = chalk.bold('\u25cf ');

const pluralize = (word, count) => `${count} ${word}${count === 1 ? '' : 's'}`;

class DefaultReporter extends BaseReporter {
  onRunStart(config: Config, results: AggregatedResult) {
    this._printWaitingOn(results, config);
  }

  onTestResult(
    config: Config,
    testResult: TestResult,
    results: AggregatedResult,
  ) {
    this._clearWaitingOn(config);
    this._printTestFileSummary(config, testResult);
    this._printWaitingOn(results, config);
  }

  _printTestFileSummary(config: Config, testResult: TestResult) {
    this.log(getResultHeader(testResult, config));

    const consoleBuffer = testResult.console;
    if (consoleBuffer && consoleBuffer.length) {
      this._write(
        '  ' + TITLE_BULLET + 'Console\n' +
        getConsoleOutput(config.rootDir, config.verbose, consoleBuffer),
      );
    }

    if (testResult.failureMessage) {
      this._write(testResult.failureMessage + '\n');
    }
  }

  _clearWaitingOn(config: Config) {
    process.stderr.write(config.noHighlight ? '' : '\r\x1B[K');
  }

  _printWaitingOn(results: AggregatedResult, config: Config) {
    const remaining = results.numTotalTestSuites -
      results.numPassedTestSuites -
      results.numFailedTestSuites -
      results.numRuntimeErrorTestSuites;
    if (!config.noHighlight && remaining > 0) {
      process.stderr.write(RUNNING_TEST_COLOR(
        `Running ${pluralize('test suite', remaining)}...`,
      ));
    }
  }
}

module.exports = DefaultReporter;
