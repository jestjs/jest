/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  AssertionResult,
  TestResult,
  createEmptyTestResult,
} from '@jest/test-result';
import type {Config} from '@jest/types';
import {formatResultsErrors} from 'jest-message-util';
import type {SpecResult} from './jasmine/Spec';
import type {SuiteResult} from './jasmine/Suite';
import type {Reporter, RunDetails} from './types';

type Microseconds = number;

export default class Jasmine2Reporter implements Reporter {
  private readonly _testResults: Array<AssertionResult>;
  private readonly _globalConfig: Config.GlobalConfig;
  private readonly _config: Config.ProjectConfig;
  private readonly _currentSuites: Array<string>;
  private _resolve: any;
  private readonly _resultsPromise: Promise<TestResult>;
  private readonly _startTimes: Map<string, Microseconds>;
  private readonly _testPath: string;

  constructor(
    globalConfig: Config.GlobalConfig,
    config: Config.ProjectConfig,
    testPath: string,
  ) {
    this._globalConfig = globalConfig;
    this._config = config;
    this._testPath = testPath;
    this._testResults = [];
    this._currentSuites = [];
    this._resolve = null;
    this._resultsPromise = new Promise(resolve => (this._resolve = resolve));
    this._startTimes = new Map();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  jasmineStarted(_runDetails: RunDetails): void {}

  specStarted(spec: SpecResult): void {
    this._startTimes.set(spec.id, Date.now());
  }

  specDone(result: SpecResult): void {
    this._testResults.push(
      this._extractSpecResults(result, this._currentSuites.slice(0)),
    );
  }

  suiteStarted(suite: SuiteResult): void {
    this._currentSuites.push(suite.description);
  }

  suiteDone(_result: SuiteResult): void {
    this._currentSuites.pop();
  }

  jasmineDone(_runDetails: RunDetails): void {
    let numFailingTests = 0;
    let numPassingTests = 0;
    let numPendingTests = 0;
    let numTodoTests = 0;
    const testResults = this._testResults;
    testResults.forEach(testResult => {
      if (testResult.status === 'failed') {
        numFailingTests++;
      } else if (testResult.status === 'pending') {
        numPendingTests++;
      } else if (testResult.status === 'todo') {
        numTodoTests++;
      } else {
        numPassingTests++;
      }
    });

    const testResult = {
      ...createEmptyTestResult(),
      console: null,
      failureMessage: formatResultsErrors(
        testResults,
        this._config,
        this._globalConfig,
        this._testPath,
      ),
      numFailingTests,
      numPassingTests,
      numPendingTests,
      numTodoTests,
      snapshot: {
        added: 0,
        fileDeleted: false,
        matched: 0,
        unchecked: 0,
        unmatched: 0,
        updated: 0,
      },
      testFilePath: this._testPath,
      testResults,
    };

    this._resolve(testResult);
  }

  getResults(): Promise<TestResult> {
    return this._resultsPromise;
  }

  private _addMissingMessageToStack(stack: string, message?: string) {
    // Some errors (e.g. Angular injection error) don't prepend error.message
    // to stack, instead the first line of the stack is just plain 'Error'
    const ERROR_REGEX = /^Error:?\s*\n/;

    if (stack && message && !stack.includes(message)) {
      return message + stack.replace(ERROR_REGEX, '\n');
    }
    return stack;
  }

  private _extractSpecResults(
    specResult: SpecResult,
    ancestorTitles: Array<string>,
  ): AssertionResult {
    const status =
      specResult.status === 'disabled' ? 'pending' : specResult.status;
    const start = this._startTimes.get(specResult.id);
    const duration =
      start && !['pending', 'skipped'].includes(status)
        ? Date.now() - start
        : null;
    const location = specResult.__callsite
      ? {
          column: specResult.__callsite.getColumnNumber(),
          line: specResult.__callsite.getLineNumber(),
        }
      : null;
    const results: AssertionResult = {
      ancestorTitles,
      duration,
      failureDetails: [],
      failureMessages: [],
      fullName: specResult.fullName,
      location,
      numPassingAsserts: 0, // Jasmine2 only returns an array of failed asserts.
      status,
      title: specResult.description,
    };

    specResult.failedExpectations.forEach(failed => {
      const message =
        !failed.matcherName && typeof failed.stack === 'string'
          ? this._addMissingMessageToStack(failed.stack, failed.message)
          : failed.message || '';
      results.failureMessages.push(message);
      results.failureDetails.push(failed);
    });

    return results;
  }
}
