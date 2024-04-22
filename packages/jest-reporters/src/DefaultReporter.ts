/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {WriteStream} from 'tty';
import chalk = require('chalk');
import {getConsoleOutput} from '@jest/console';
import type {
  AggregatedResult,
  Test,
  TestCaseResult,
  TestResult,
} from '@jest/test-result';
import type {Config} from '@jest/types';
import {
  formatStackTrace,
  indentAllLines,
  separateMessageFromStack,
} from 'jest-message-util';
import {clearLine, isInteractive} from 'jest-util';
import BaseReporter from './BaseReporter';
import Status from './Status';
import getResultHeader from './getResultHeader';
import getSnapshotStatus from './getSnapshotStatus';
import type {ReporterOnStartOptions} from './types';

type write = WriteStream['write'];
type FlushBufferedOutput = () => void;

const TITLE_BULLET = chalk.bold('\u25CF ');

export default class DefaultReporter extends BaseReporter {
  private _clear: string; // ANSI clear sequence for the last printed status
  private readonly _err: write;
  protected _globalConfig: Config.GlobalConfig;
  private readonly _out: write;
  private readonly _status: Status;
  private readonly _bufferedOutput: Set<FlushBufferedOutput>;

  static readonly filename = __filename;

  constructor(globalConfig: Config.GlobalConfig) {
    super();
    this._globalConfig = globalConfig;
    this._clear = '';
    this._out = process.stdout.write.bind(process.stdout);
    this._err = process.stderr.write.bind(process.stderr);
    this._status = new Status(globalConfig);
    this._bufferedOutput = new Set();
    this.__wrapStdio(process.stdout);
    this.__wrapStdio(process.stderr);
    this._status.onChange(() => {
      this.__beginSynchronizedUpdate(
        this._globalConfig.useStderr ? this._err : this._out,
      );
      this.__clearStatus();
      this.__printStatus();
      this.__endSynchronizedUpdate(
        this._globalConfig.useStderr ? this._err : this._out,
      );
    });
  }

  protected __wrapStdio(stream: NodeJS.WritableStream | WriteStream): void {
    const write = stream.write.bind(stream);

    let buffer: Array<string> = [];
    let timeout: NodeJS.Timeout | null = null;

    const flushBufferedOutput = () => {
      const string = buffer.join('');
      buffer = [];

      // This is to avoid conflicts between random output and status text
      this.__beginSynchronizedUpdate(
        this._globalConfig.useStderr ? this._err : this._out,
      );
      this.__clearStatus();
      if (string) {
        write(string);
      }
      this.__printStatus();
      this.__endSynchronizedUpdate(
        this._globalConfig.useStderr ? this._err : this._out,
      );

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

    stream.write = (chunk: string) => {
      buffer.push(chunk);
      debouncedFlush();
      return true;
    };
  }

  // Don't wait for the debounced call and flush all output immediately.
  forceFlushBufferedOutput(): void {
    for (const flushBufferedOutput of this._bufferedOutput) {
      flushBufferedOutput();
    }
  }

  protected __clearStatus(): void {
    if (isInteractive) {
      if (this._globalConfig.useStderr) {
        this._err(this._clear);
      } else {
        this._out(this._clear);
      }
    }
  }

  protected __printStatus(): void {
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

  override onRunStart(
    aggregatedResults: AggregatedResult,
    options: ReporterOnStartOptions,
  ): void {
    this._status.runStarted(aggregatedResults, options);
  }

  override onTestStart(test: Test): void {
    this._status.testStarted(test.path, test.context.config);
  }

  override onTestCaseResult(test: Test, testCaseResult: TestCaseResult): void {
    this._status.addTestCaseResult(test, testCaseResult);
  }

  override onRunComplete(): void {
    this.forceFlushBufferedOutput();
    this._status.runFinished();
    process.stdout.write = this._out;
    process.stderr.write = this._err;
    clearLine(process.stderr);
  }

  override onTestResult(
    test: Test,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ): void {
    this.testFinished(test.context.config, testResult, aggregatedResults);
    if (!testResult.skipped) {
      this.printTestFileHeader(
        testResult.testFilePath,
        test.context.config,
        testResult,
      );
      this.printTestFileFailureMessage(
        testResult.testFilePath,
        test.context.config,
        testResult,
      );
    }
    this.forceFlushBufferedOutput();
  }

  testFinished(
    config: Config.ProjectConfig,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ): void {
    this._status.testFinished(config, testResult, aggregatedResults);
  }

  printTestFileHeader(
    testPath: string,
    config: Config.ProjectConfig,
    result: TestResult,
  ): void {
    // log retry errors if any exist
    for (const testResult of result.testResults) {
      const testRetryReasons = testResult.retryReasons;
      if (testRetryReasons && testRetryReasons.length > 0) {
        this.log(
          `${chalk.reset.inverse.bold.yellow(' LOGGING RETRY ERRORS ')} ${chalk.bold(testResult.fullName)}`,
        );
        for (const [index, retryReasons] of testRetryReasons.entries()) {
          let {message, stack} = separateMessageFromStack(retryReasons);
          stack = this._globalConfig.noStackTrace
            ? ''
            : chalk.dim(
                formatStackTrace(stack, config, this._globalConfig, testPath),
              );

          message = indentAllLines(message);

          this.log(
            `${chalk.reset.inverse.bold.blueBright(` RETRY ${index + 1} `)}\n`,
          );
          this.log(`${message}\n${stack}\n`);
        }
      }
    }

    this.log(getResultHeader(result, this._globalConfig, config));
    if (result.console) {
      this.log(
        `  ${TITLE_BULLET}Console\n\n${getConsoleOutput(result.console, config, this._globalConfig)}`,
      );
    }
  }

  printTestFileFailureMessage(
    _testPath: string,
    _config: Config.ProjectConfig,
    result: TestResult,
  ): void {
    if (result.failureMessage) {
      this.log(result.failureMessage);
    }
    const didUpdate = this._globalConfig.updateSnapshot === 'all';
    const snapshotStatuses = getSnapshotStatus(result.snapshot, didUpdate);
    for (const status of snapshotStatuses) this.log(status);
  }
}
