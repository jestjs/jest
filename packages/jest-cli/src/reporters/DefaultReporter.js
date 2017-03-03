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

'use strict';

import type {AggregatedResult, TestResult} from 'types/TestResult';
import type {Config, Path} from 'types/Config';
import type {ReporterOnStartOptions, RunnerContext} from 'types/Reporters';

const BaseReporter = require('./BaseReporter');
const Status = require('./Status');

const {clearLine} = require('jest-util');
const chalk = require('chalk');
const getConsoleOutput = require('./getConsoleOutput');
const getResultHeader = require('./getResultHeader');
const {isCI} = require('../utils');

type write = (chunk: string, enc?: any, cb?: () => void) => boolean;

const TITLE_BULLET = chalk.bold('\u25cf ');

const isInteractive = process.stdin.isTTY && !isCI;

class DefaultReporter extends BaseReporter {
  _clear: string; // ANSI clear sequence for the last printed status
  _currentlyRunning: Map<Path, Config>;
  _currentStatusHeight: number;
  _err: write;
  _lastAggregatedResults: AggregatedResult;
  _out: write;
  _status: Status;

  constructor() {
    super();
    this._clear = '';
    this._out = process.stdout.write.bind(process.stdout);
    this._err = process.stderr.write.bind(process.stderr);
    this._status = new Status();
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

    const doFlush = () => {
      const string = buffer.join('');
      buffer = [];
      // This is to avoid conflicts between random output and status text
      this._clearStatus();
      originalWrite.call(stream, string);
      this._printStatus();
    };

    const flush = () => {
      // If the process blows up no errors would be printed.
      // There should be a smart way to buffer stderr, but for now
      // we just won't buffer it.
      if (stream === process.stderr) {
        doFlush();
      } else {
        if (!timeout) {
          timeout = setTimeout(() => {
            doFlush();
            timeout = null;
          }, 100);
        }
      }
    };

    // $FlowFixMe
    stream.write = chunk => {
      buffer.push(chunk);
      flush();
      return true;
    };
  }

  _clearStatus() {
    if (isInteractive) {
      this._out(this._clear);
    }
  }

  _printStatus() {
    const {content, clear} = this._status.get();
    this._clear = clear;
    if (isInteractive) {
      this._out(content);
    }
  }

  onRunStart(
    config: Config,
    aggregatedResults: AggregatedResult,
    runnerContext: RunnerContext,
    options: ReporterOnStartOptions,
  ) {
    this._status.runStarted(aggregatedResults, options);
  }

  onTestStart(config: Config, testPath: Path) {
    this._status.testStarted(testPath, config);
  }

  onRunComplete() {
    this._status.runFinished();
    // $FlowFixMe
    process.stdout.write = this._out;
    // $FlowFixMe
    process.stderr.write = this._err;
    clearLine(process.stderr);
  }

  onTestResult(
    config: Config,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ) {
    this._status.testFinished(config, testResult, aggregatedResults);
    this._printTestFileSummary(testResult.testFilePath, config, testResult);
  }

  _printTestFileSummary(
    testPath: Path,
    config: Config,
    result: TestResult,
  ) {
    if (!result.skipped) {
      this.log(getResultHeader(result, config));

      const consoleBuffer = result.console;
      if (consoleBuffer && consoleBuffer.length) {
        this.log(
          '  ' + TITLE_BULLET + 'Console\n\n' +
          getConsoleOutput(
            config.rootDir,
            !!config.verbose,
            consoleBuffer,
          ),
        );
      }

      if (result.failureMessage) {
        this.log(result.failureMessage);
      }
    }
  }
}

module.exports = DefaultReporter;
