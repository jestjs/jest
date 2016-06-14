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

import type {Config} from 'types/Config';
import type {Environment} from 'types/Environment';
import type {
  AssertionResult,
  FailedAssertion,
  Status,
  TestResult,
} from 'types/TestResult';

const jasmineRequire = require('../vendor/jasmine-2.4.1.js');
const jasmine = jasmineRequire.core(jasmineRequire);
const JasmineFormatter = require('jest-util').JasmineFormatter;

type Suite = {
  description: string,
};

type SpecResult = {
  description: string,
  failedExpectations: Array<FailedAssertion>,
  status: Status,
};

class Jasmine2Reporter {
  _formatter: JasmineFormatter;
  _testResults: Array<AssertionResult>;
  _currentSuites: Array<string>;
  _resolve: any;
  _resultsPromise: Promise<TestResult>;

  constructor(config: Config, environment: Environment) {
    this._formatter = new JasmineFormatter(jasmine, environment, config);
    this._testResults = [];
    this._currentSuites = [];
    this._resolve = null;
    this._resultsPromise = new Promise(resolve => this._resolve = resolve);
  }

  specDone(result: SpecResult): void {
    this._testResults.push(
      this._extractSpecResults(result, this._currentSuites.slice(0))
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
    this._resolve({
      numFailingTests,
      numPassingTests,
      numPendingTests,
      testResults,
    });
  }

  getFormatter(): JasmineFormatter {
    return this._formatter;
  }

  getResults(): Promise<TestResult> {
    return this._resultsPromise;
  }

  _extractSpecResults(
    specResult: SpecResult,
    ancestorTitles: Array<string>,
  ): AssertionResult {
    const status =
      (specResult.status === 'disabled') ? 'pending' : specResult.status;
    const results = {
      title: 'it ' + specResult.description,
      status,
      ancestorTitles,
      failureMessages: [],
      numPassingAsserts: 0, // Jasmine2 only returns an array of failed asserts.
    };

    specResult.failedExpectations.forEach(failed => {
      let message;
      if (!failed.matcherName && failed.stack) {
        message = failed.stack;
      } else {
        message = this._formatter.formatMatchFailure(failed);
      }
      results.failureMessages.push(message);
    });

    return results;
  }
}

module.exports = Jasmine2Reporter;
