/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {types} from 'util';
import {
  type AssertionResult,
  type FailedAssertion,
  type TestResult,
  createEmptyTestResult,
} from '@jest/test-result';
import type {Config} from '@jest/types';
import {formatResultsErrors} from 'jest-message-util';
import type {SpecResult} from './jasmine/Spec';
import type {SuiteResult} from './jasmine/Suite';
import type {Reporter, RunDetails} from './types';

type Microseconds = number;

const isErrorWithCause = (
  error: unknown,
): error is Error & {cause: Error | string} =>
  (types.isNativeError(error) || error instanceof Error) &&
  'cause' in error &&
  (typeof error.cause === 'string' ||
    types.isNativeError(error.cause) ||
    error.cause instanceof Error);

const formatErrorStackWithCause = (error: Error, seen: Set<Error>): string => {
  const stack =
    typeof error.stack === 'string' && error.stack !== ''
      ? error.stack
      : error.message;

  if (!isErrorWithCause(error)) {
    return stack;
  }

  let cause: string;
  if (typeof error.cause === 'string') {
    cause = error.cause;
  } else if (seen.has(error.cause)) {
    cause = '[Circular cause]';
  } else {
    seen.add(error);
    cause = formatErrorStackWithCause(error.cause, seen);
  }

  return `${stack}\n\n[cause]: ${cause}`;
};

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
      this._extractSpecResults(result, [...this._currentSuites]),
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
    for (const testResult of testResults) {
      if (testResult.status === 'failed') {
        numFailingTests++;
      } else if (testResult.status === 'pending') {
        numPendingTests++;
      } else if (testResult.status === 'todo') {
        numTodoTests++;
      } else {
        numPassingTests++;
      }
    }

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

  private _getFailureMessage(failed: FailedAssertion): string {
    const message =
      !failed.matcherName && typeof failed.stack === 'string'
        ? this._addMissingMessageToStack(failed.stack, failed.message)
        : failed.message || '';

    if (isErrorWithCause(failed.error)) {
      return formatErrorStackWithCause(failed.error, new Set());
    }

    return message;
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

    for (const failed of specResult.failedExpectations) {
      const message = this._getFailureMessage(failed);
      results.failureMessages.push(message);
      results.failureDetails.push(failed);
    }

    return results;
  }
}
