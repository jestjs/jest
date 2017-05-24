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

import type {AggregatedResult, TestResult} from 'types/TestResult';
import type {GlobalConfig, Path, ProjectConfig} from 'types/Config';
import type {Test} from 'types/TestRunner';
import type {ReporterOnStartOptions} from 'types/Reporters';

import {clearLine, getConsoleOutput} from 'jest-util';
import chalk from 'chalk';
import isCI from 'is-ci';
import BaseReporter from './base_reporter';
import Status from './Status';
import getResultHeader from './get_result_header';
import getSnapshotStatus from './get_snapshot_status';

type write = (chunk: string, enc?: any, cb?: () => void) => boolean;
type FlushBufferedOutput = () => void;

const TITLE_BULLET = chalk.bold('\u25cf ');

const isInteractive = process.stdin.isTTY && !isCI;

class DefaultReporter extends BaseReporter {
  _clear: string; // ANSI clear sequence for the last printed status
  _err: write;
  _globalConfig: GlobalConfig;
  _out: write;
  _status: Status;
  _bufferedOutput: Set<FlushBufferedOutput>;

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
  }

  _printTestFileSummary(
    testPath: Path,
    config: ProjectConfig,
    result: TestResult,
  ) {
    if (!result.skipped) {
      this.log(getResultHeader(result, config));

      const consoleBuffer = result.console;
      if (consoleBuffer && consoleBuffer.length) {
        this.log(
          '  ' +
            TITLE_BULLET +
            'Console\n\n' +
            getConsoleOutput(
              config.rootDir,
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
}

module.exports = DefaultReporter;
