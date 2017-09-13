/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

/* global stream$Writable, tty$WriteStream */

import type {
  AggregatedResult,
  AssertionResult,
  Suite,
  TestResult,
} from 'types/TestResult';
import type {GlobalConfig, Path, ProjectConfig} from 'types/Config';
import type {Test} from 'types/TestRunner';
import type {ReporterOnStartOptions} from 'types/Reporters';

import {ICONS} from '../constants';
import {clearLine, getConsoleOutput} from 'jest-util';
import chalk from 'chalk';
import isCI from 'is-ci';
import BaseReporter from './base_reporter';
import Status from './Status';
import getResultHeader from './get_result_header';
import getSnapshotStatus from './get_snapshot_status';
import shouldUseVerbose from '../should_use_verbose';
import groupTestsBySuites from './_group_tests_by_suites.js';

type write = (chunk: string, enc?: any, cb?: () => void) => boolean;
type FlushBufferedOutput = () => void;

const TITLE_BULLET = chalk.bold('\u25cf ');

const isInteractive = process.stdin.isTTY && !isCI;

export default class DefaultReporter extends BaseReporter {
  _clear: string; // ANSI clear sequence for the last printed status
  _err: write;
  _globalConfig: GlobalConfig;
  _out: write;
  _status: Status;
  _bufferedOutput: Set<FlushBufferedOutput>;
  _verbose: ?boolean;

  constructor(globalConfig: GlobalConfig) {
    super();
    this._globalConfig = globalConfig;
    this._clear = '';
    this._out = process.stdout.write.bind(process.stdout);
    this._err = process.stderr.write.bind(process.stderr);
    this._status = new Status();
    this._bufferedOutput = new Set();
    this._wrapStdio(process.stdout);
    this._wrapStdio(process.stderr);
    this._status.onChange(() => {
      this._clearStatus();
      this._printStatus();
    });
  }

  _wrapStdio(stream: stream$Writable | tty$WriteStream) {
    const originalWrite = stream.write;

    let buffer = [];
    let timeout = null;

    const flushBufferedOutput = () => {
      const string = buffer.join('');
      buffer = [];

      // This is to avoid conflicts between random output and status text
      this._clearStatus();
      if (string) {
        originalWrite.call(stream, string);
      }
      this._printStatus();

      this._bufferedOutput.delete(flushBufferedOutput);
    };

    this._bufferedOutput.add(flushBufferedOutput);

    const debouncedFlush = () => {
      // If the process blows up no errors would be printed.
      // There should be a smart way to buffer stderr, but for now
      // we just won't buffer it.
      if (stream === process.stderr) {
        flushBufferedOutput();
      } else {
        if (!timeout) {
          timeout = setTimeout(() => {
            flushBufferedOutput();
            timeout = null;
          }, 100);
        }
      }
    };

    // $FlowFixMe
    stream.write = chunk => {
      buffer.push(chunk);
      debouncedFlush();
      return true;
    };
  }

  // Don't wait for the debounced call and flush all output immediately.
  forceFlushBufferedOutput() {
    for (const flushBufferedOutput of this._bufferedOutput) {
      flushBufferedOutput();
    }
  }

  _clearStatus() {
    if (isInteractive) {
      if (this._globalConfig.useStderr) {
        this._err(this._clear);
      } else {
        this._out(this._clear);
      }
    }
  }

  _printStatus() {
    const {content, clear} = this._status.get();
    this._clear = clear;
    if (isInteractive) {
      if (this._globalConfig.useStderr) {
        this._err(content);
      } else {
        this._out(content);
      }
    }
  }

  onRunStart(
    aggregatedResults: AggregatedResult,
    options: ReporterOnStartOptions,
  ) {
    this._verbose = shouldUseVerbose(this._globalConfig, options.numOfTests);
    this._status.runStarted(aggregatedResults, options);
  }

  onTestStart(test: Test) {
    this._status.testStarted(test.path, test.context.config);
  }

  onRunComplete() {
    this.forceFlushBufferedOutput();
    this._status.runFinished();
    // $FlowFixMe
    process.stdout.write = this._out;
    // $FlowFixMe
    process.stderr.write = this._err;
    clearLine(process.stderr);
  }

  onTestResult(
    test: Test,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ) {
    this._status.testFinished(
      test.context.config,
      testResult,
      aggregatedResults,
    );
    this._printTestFileSummary(
      testResult.testFilePath,
      test.context.config,
      testResult,
    );
    this.forceFlushBufferedOutput();
    if (this._verbose && !testResult.testExecError && !testResult.skipped) {
      this._logTestResultsVerbose(testResult.testResults);
    }
  }

  _printTestFileSummary(
    testPath: Path,
    config: ProjectConfig,
    result: TestResult,
  ) {
    if (!result.skipped) {
      this.log(getResultHeader(result, this._globalConfig, config));

      const consoleBuffer = result.console;
      if (consoleBuffer && consoleBuffer.length) {
        this.log(
          '  ' +
            TITLE_BULLET +
            'Console\n\n' +
            getConsoleOutput(
              config.cwd,
              !!this._globalConfig.verbose,
              consoleBuffer,
            ),
        );
      }

      if (result.failureMessage) {
        this.log(result.failureMessage);
      }

      const didUpdate = this._globalConfig.updateSnapshot === 'all';
      const snapshotStatuses = getSnapshotStatus(result.snapshot, didUpdate);
      snapshotStatuses.forEach(this.log);
    }
  }

  _logTestResultsVerbose(testResults: Array<AssertionResult>) {
    this._logSuiteVerbose(groupTestsBySuites(testResults), 0);
  }

  _logSuiteVerbose(suite: Suite, indentLevel: number) {
    if (suite.title) {
      this._logLineVerbose(suite.title, indentLevel);
    }

    this._logTestsVerbose(suite.tests, indentLevel + 1);

    suite.suites.forEach(suite =>
      this._logSuiteVerbose(suite, indentLevel + 1),
    );
  }

  _logLineVerbose(str?: string, indentLevel?: number) {
    const indentation = '  '.repeat(indentLevel || 0);
    this.log(indentation + (str || ''));
  }

  _logTestsVerbose(tests: Array<AssertionResult>, indentLevel: number) {
    if (this._globalConfig.expand) {
      tests.forEach(test => this._logTestVerbose(test, indentLevel));
    } else {
      const skippedCount = tests.reduce((result, test) => {
        if (test.status === 'pending') {
          result += 1;
        } else {
          this._logTestVerbose(test, indentLevel);
        }

        return result;
      }, 0);

      if (skippedCount > 0) {
        this._logSkippedTestsVerbose(skippedCount, indentLevel);
      }
    }
  }

  _logTestVerbose(test: AssertionResult, indentLevel: number) {
    const status = this._getIconVerbose(test.status);
    const time = test.duration ? ` (${test.duration.toFixed(0)}ms)` : '';
    this._logLineVerbose(
      status + ' ' + chalk.dim(test.title + time),
      indentLevel,
    );
  }

  _getIconVerbose(status: string) {
    if (status === 'failed') {
      return chalk.red(ICONS.failed);
    } else if (status === 'pending') {
      return chalk.yellow(ICONS.pending);
    } else {
      return chalk.green(ICONS.success);
    }
  }
  _logSkippedTestsVerbose(count: number, indentLevel: number) {
    const icon = this._getIconVerbose('pending');
    const text = chalk.dim(`skipped ${count} test${count === 1 ? '' : 's'}`);

    this._logLineVerbose(`${icon} ${text}`, indentLevel);
  }
}
