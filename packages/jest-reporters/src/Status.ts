/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pc from 'picocolors';
import stringLength = require('string-length');
import type {
  AggregatedResult,
  Test,
  TestCaseResult,
  TestResult,
} from '@jest/test-result';
import type {Config} from '@jest/types';
import getSummary from './getSummary';
import printDisplayName from './printDisplayName';
import trimAndFormatPath from './trimAndFormatPath';
import type {ReporterOnStartOptions} from './types';
import wrapAnsiString from './wrapAnsiString';

const RUNNING_TEXT = ' RUNS ';
const RUNNING = `${pc.reset(pc.inverse(pc.yellow(pc.bold(RUNNING_TEXT))))} `;

/**
 * This class is a perf optimization for sorting the list of currently
 * running tests. It tries to keep tests in the same positions without
 * shifting the whole list.
 */
class CurrentTestList {
  private _array: Array<{
    testPath: string;
    config: Config.ProjectConfig;
  } | null>;

  constructor() {
    this._array = [];
  }

  add(testPath: string, config: Config.ProjectConfig) {
    const index = this._array.indexOf(null);
    const record = {config, testPath};
    if (index === -1) {
      this._array.push(record);
    } else {
      this._array[index] = record;
    }
  }

  delete(testPath: string) {
    const record = this._array.find(
      record => record !== null && record.testPath === testPath,
    );
    this._array[this._array.indexOf(record || null)] = null;
  }

  get() {
    return this._array;
  }
}

type Cache = {
  content: string;
  clear: string;
};

/**
 * A class that generates the CLI status of currently running tests
 * and also provides an ANSI escape sequence to remove status lines
 * from the terminal.
 */
export default class Status {
  private _cache: Cache | null;
  private _callback?: () => void;
  private readonly _currentTests: CurrentTestList;
  private _currentTestCases: Array<{
    test: Test;
    testCaseResult: TestCaseResult;
  }>;
  private _done: boolean;
  private _emitScheduled: boolean;
  private _estimatedTime: number;
  private _interval?: NodeJS.Timeout;
  private _aggregatedResults?: AggregatedResult;
  private _showStatus: boolean;

  constructor(private readonly _globalConfig: Config.GlobalConfig) {
    this._cache = null;
    this._currentTests = new CurrentTestList();
    this._currentTestCases = [];
    this._done = false;
    this._emitScheduled = false;
    this._estimatedTime = 0;
    this._showStatus = false;
  }

  onChange(callback: () => void): void {
    this._callback = callback;
  }

  runStarted(
    aggregatedResults: AggregatedResult,
    options: ReporterOnStartOptions,
  ): void {
    this._estimatedTime = (options && options.estimatedTime) || 0;
    this._showStatus = options && options.showStatus;
    this._interval = setInterval(() => this._tick(), 1000);
    this._aggregatedResults = aggregatedResults;
    this._debouncedEmit();
  }

  runFinished(): void {
    this._done = true;
    if (this._interval) clearInterval(this._interval);
    this._emit();
  }

  addTestCaseResult(test: Test, testCaseResult: TestCaseResult): void {
    this._currentTestCases.push({test, testCaseResult});
    if (this._showStatus) {
      this._debouncedEmit();
    } else {
      this._emit();
    }
  }

  testStarted(testPath: string, config: Config.ProjectConfig): void {
    this._currentTests.add(testPath, config);
    if (this._showStatus) {
      this._debouncedEmit();
    } else {
      this._emit();
    }
  }

  testFinished(
    _config: Config.ProjectConfig,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ): void {
    const {testFilePath} = testResult;
    this._aggregatedResults = aggregatedResults;
    this._currentTests.delete(testFilePath);
    this._currentTestCases = this._currentTestCases.filter(({test}) => {
      if (_config !== test.context.config) {
        return true;
      }
      return test.path !== testFilePath;
    });
    this._debouncedEmit();
  }

  get(): Cache {
    if (this._cache) {
      return this._cache;
    }

    if (this._done) {
      return {clear: '', content: ''};
    }

    const width = process.stdout.columns;
    let content = '\n';
    for (const record of this._currentTests.get()) {
      if (record) {
        const {config, testPath} = record;

        const projectDisplayName = config.displayName
          ? `${printDisplayName(config)} `
          : '';
        const prefix = RUNNING + projectDisplayName;

        content += `${wrapAnsiString(
          prefix +
            trimAndFormatPath(stringLength(prefix), config, testPath, width),
          width,
        )}\n`;
      }
    }

    if (this._showStatus && this._aggregatedResults) {
      content += `\n${getSummary(this._aggregatedResults, {
        currentTestCases: this._currentTestCases,
        estimatedTime: this._estimatedTime,
        roundTime: true,
        seed: this._globalConfig.seed,
        showSeed: this._globalConfig.showSeed,
        width,
      })}`;
    }

    let height = 0;

    for (const char of content) {
      if (char === '\n') {
        height++;
      }
    }

    const clear = '\r\u001B[K\r\u001B[1A'.repeat(height);
    return (this._cache = {clear, content});
  }

  private _emit() {
    this._cache = null;
    if (this._callback) this._callback();
  }

  private _debouncedEmit() {
    if (!this._emitScheduled) {
      // Perf optimization to avoid two separate renders When
      // one test finishes and another test starts executing.
      this._emitScheduled = true;
      setTimeout(() => {
        this._emit();
        this._emitScheduled = false;
      }, 100);
    }
  }

  private _tick() {
    this._debouncedEmit();
  }
}
