/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Config} from '@jest/types';
import {AssertionResult, TestResult} from '@jest/test-result';
import {formatResultsErrors} from 'jest-message-util';
import {SpecResult} from './jasmine/Spec';
import {SuiteResult} from './jasmine/Suite';
import {Reporter, RunDetails} from './types';

type Microseconds = number;

export default class Jasmine2Reporter implements Reporter {
  private _testResults: Array<AssertionResult>;
  private _globalConfig: Config.GlobalConfig;
  private _config: Config.ProjectConfig;
  private _currentSuites: Array<string>;
  private _resolve: any;
  private _resultsPromise: Promise<TestResult>;
  private _startTimes: Map<string, Microseconds>;
  private _testPath: Config.Path;

  constructor(
    globalConfig: Config.GlobalConfig,
    config: Config.ProjectConfig,
    testPath: Config.Path,
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

  jasmineStarted(_runDetails: RunDetails) {}

  specStarted(spec: SpecResult) {
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
      perfStats: {
        end: 0,
        start: 0,
      },
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
    const ERROR_REGEX = /^Error\s*\n/;
    if (
      stack &&
      message &&
      ERROR_REGEX.test(stack) &&
      stack.indexOf(message) === -1
    ) {
      return message + stack.replace(ERROR_REGEX, '\n');
    }
    return stack;
  }

  private _extractSpecResults(
    specResult: SpecResult,
    ancestorTitles: Array<string>,
  ): AssertionResult {
    const start = this._startTimes.get(specResult.id);
    const duration = start ? Date.now() - start : undefined;
    const status =
      specResult.status === 'disabled' ? 'pending' : specResult.status;
    const location = specResult.__callsite
      ? {
          column: specResult.__callsite.getColumnNumber(),
          line: specResult.__callsite.getLineNumber(),
        }
      : null;
    const results: AssertionResult = {
      ancestorTitles,
      duration,
      failureMessages: [],
      fullName: specResult.fullName,
      location,
      numPassingAsserts: 0, // Jasmine2 only returns an array of failed asserts.
      status,
      title: specResult.description,
    };

    specResult.failedExpectations.forEach(failed => {
      const message =
        !failed.matcherName && failed.stack
          ? this._addMissingMessageToStack(failed.stack, failed.message)
          : failed.message || '';
      results.failureMessages.push(message);
    });

    return results;
  }
}
