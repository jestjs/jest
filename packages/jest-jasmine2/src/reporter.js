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

import type {GlobalConfig, Path, ProjectConfig} from 'types/Config';
import type {Environment} from 'types/Environment';
import type {
  AssertionResult,
  FailedAssertion,
  Milliseconds,
  Status,
  TestResult,
} from 'types/TestResult';

const {formatResultsErrors} = require('jest-message-util');

type Suite = {
  description: string,
};

type SpecResult = {
  description: string,
  duration?: Milliseconds,
  failedExpectations: Array<FailedAssertion>,
  fullName: string,
  id: string,
  status: Status,
};

type Microseconds = number;

class Jasmine2Reporter {
  _testResults: Array<AssertionResult>;
  _globalConfig: GlobalConfig;
  _config: ProjectConfig;
  _currentSuites: Array<string>;
  _resolve: any;
  _resultsPromise: Promise<TestResult>;
  _startTimes: Map<string, Microseconds>;
  _testPath: Path;

  constructor(
    globalConfig: GlobalConfig,
    config: ProjectConfig,
    environment: Environment,
    testPath: Path,
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

  specStarted(spec: {id: string}) {
    this._startTimes.set(spec.id, Date.now());
  }

  specDone(result: SpecResult): void {
    this._testResults.push(
      this._extractSpecResults(result, this._currentSuites.slice(0)),
    );
  }

  suiteStarted(suite: Suite): void {
    this._currentSuites.push(suite.description);
  }

  suiteDone(): void {
    this._currentSuites.pop();
  }

  jasmineDone(): void {
    let numFailingTests = 0;
    let numPassingTests = 0;
    let numPendingTests = 0;
    const testResults = this._testResults;
    testResults.forEach(testResult => {
      if (testResult.status === 'failed') {
        numFailingTests++;
      } else if (testResult.status === 'pending') {
        numPendingTests++;
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

  _addMissingMessageToStack(stack: string, message: ?string) {
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

  _extractSpecResults(
    specResult: SpecResult,
    ancestorTitles: Array<string>,
  ): AssertionResult {
    const start = this._startTimes.get(specResult.id);
    const duration = start ? Date.now() - start : undefined;
    const status = specResult.status === 'disabled'
      ? 'pending'
      : specResult.status;
    const results = {
      ancestorTitles,
      duration,
      failureMessages: [],
      fullName: specResult.fullName,
      numPassingAsserts: 0, // Jasmine2 only returns an array of failed asserts.
      status,
      title: specResult.description,
    };

    specResult.failedExpectations.forEach(failed => {
      const message = !failed.matcherName && failed.stack
        ? this._addMissingMessageToStack(failed.stack, failed.message)
        : failed.message || '';
      results.failureMessages.push(message);
    });

    return results;
  }
}

module.exports = Jasmine2Reporter;
