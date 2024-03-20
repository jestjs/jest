/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {skipSuiteOnJasmine} from '@jest/test-utils';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

skipSuiteOnJasmine();

describe('Test Retries', () => {
  const outputFileName = 'retries.result.json';
  const outputFilePath = path.join(
    process.cwd(),
    'e2e/test-retries/',
    outputFileName,
  );
  const logErrorsBeforeRetryErrorMessage = 'LOGGING RETRY ERRORS';

  afterAll(() => {
    fs.unlinkSync(outputFilePath);
  });

  it('retries failed tests', () => {
    const result = runJest('test-retries', ['e2e.test.js']);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.stderr).not.toContain(logErrorsBeforeRetryErrorMessage);
  });

  it('logs error(s) before retry', () => {
    const result = runJest('test-retries', ['logErrorsBeforeRetries.test.js']);
    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.stderr).toContain(logErrorsBeforeRetryErrorMessage);
    expect(extractSummary(result.stderr).rest).toMatchSnapshot();
  });

  it('wait before retry', () => {
    const result = runJest('test-retries', ['waitBeforeRetry.test.js']);
    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.stderr).toContain(logErrorsBeforeRetryErrorMessage);
    expect(extractSummary(result.stderr).rest).toMatchSnapshot();
  });

  it('wait before retry with fake timers', () => {
    const result = runJest('test-retries', [
      'waitBeforeRetryFakeTimers.test.js',
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.stderr).toContain(logErrorsBeforeRetryErrorMessage);
    expect(extractSummary(result.stderr).rest).toMatchSnapshot();
  });

  it('with flag retryImmediately retry immediately after failed test', () => {
    const logMessage = `console.log
    FIRST TRUTHY TEST

      at Object.log (__tests__/retryImmediately.test.js:14:13)

  console.log
    SECOND TRUTHY TEST

      at Object.log (__tests__/retryImmediately.test.js:21:11)`;

    const result = runJest('test-retries', ['retryImmediately.test.js']);
    const stdout = result.stdout.trim();
    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.stderr).toContain(logErrorsBeforeRetryErrorMessage);
    expect(stdout).toBe(logMessage);
    expect(extractSummary(result.stderr).rest).toMatchSnapshot();
  });

  it('reporter shows more than 1 invocation if test is retried', () => {
    let jsonResult;

    const reporterConfig = {
      reporters: [
        ['<rootDir>/reporters/RetryReporter.js', {output: outputFilePath}],
      ],
    };

    runJest('test-retries', [
      '--config',
      JSON.stringify(reporterConfig),
      '__tests__/retry.test.js',
    ]);

    const testOutput = fs.readFileSync(outputFilePath, 'utf8');

    try {
      jsonResult = JSON.parse(testOutput);
    } catch (error: any) {
      throw new Error(
        `Can't parse the JSON result from ${outputFileName}, ${error.toString()}`,
      );
    }

    expect(jsonResult.numPassedTests).toBe(0);
    expect(jsonResult.numFailedTests).toBe(1);
    expect(jsonResult.numPendingTests).toBe(0);
    expect(jsonResult.testResults[0].testResults[0].invocations).toBe(4);
  });

  it('reporter shows 1 invocation if tests are not retried', () => {
    let jsonResult;

    const reporterConfig = {
      reporters: [
        ['<rootDir>/reporters/RetryReporter.js', {output: outputFilePath}],
      ],
    };

    runJest('test-retries', [
      '--config',
      JSON.stringify(reporterConfig),
      'control.test.js',
    ]);

    const testOutput = fs.readFileSync(outputFilePath, 'utf8');

    try {
      jsonResult = JSON.parse(testOutput);
    } catch (error: any) {
      throw new Error(
        `Can't parse the JSON result from ${outputFileName}, ${error.toString()}`,
      );
    }

    expect(jsonResult.numPassedTests).toBe(0);
    expect(jsonResult.numFailedTests).toBe(1);
    expect(jsonResult.numPendingTests).toBe(0);
    expect(jsonResult.testResults[0].testResults[0].invocations).toBe(1);
  });

  it('tests are not retried if beforeAll hook failure occurs', () => {
    let jsonResult;

    const reporterConfig = {
      reporters: [
        ['<rootDir>/reporters/RetryReporter.js', {output: outputFilePath}],
      ],
    };

    runJest('test-retries', [
      '--config',
      JSON.stringify(reporterConfig),
      'beforeAllFailure.test.js',
    ]);

    const testOutput = fs.readFileSync(outputFilePath, 'utf8');

    try {
      jsonResult = JSON.parse(testOutput);
    } catch (error: any) {
      throw new Error(
        `Can't parse the JSON result from ${outputFileName}, ${error.toString()}`,
      );
    }

    expect(jsonResult.numPassedTests).toBe(0);
    expect(jsonResult.numFailedTests).toBe(1);
    expect(jsonResult.numPendingTests).toBe(0);
    expect(jsonResult.testResults[0].testResults[0].invocations).toBe(1);
  });
});
