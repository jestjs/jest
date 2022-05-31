/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
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
  const reporterConfigJSON = JSON.stringify({
    reporters: [
      ['<rootDir>/reporters/RetryReporter.js', {output: outputFilePath}],
    ],
  });

  const logErrorsBeforeRetryErrorMessage = 'LOGGING RETRY ERRORS';

  afterAll(() => {
    fs.unlinkSync(outputFilePath);
  });

  it('retries failed tests', () => {
    const result = runJest('test-retries', ['e2e.test.js']);

    expect(result.exitCode).toEqual(0);
    expect(result.failed).toBe(false);
    expect(result.stderr).not.toContain(logErrorsBeforeRetryErrorMessage);
  });

  it('retries only tests matching patterns', () => {
    const result = runJest('test-retries', ['retry.test.js']);

    expect(result.exitCode).toEqual(0);
    expect(result.failed).toBe(false);
    expect(result.stderr).not.toContain(logErrorsBeforeRetryErrorMessage);
  });

  it('logs error(s) before retry', () => {
    const result = runJest('test-retries', ['logErrorsBeforeRetries.test.js']);
    expect(result.exitCode).toEqual(0);
    expect(result.failed).toBe(false);
    expect(result.stderr).toContain(logErrorsBeforeRetryErrorMessage);
    expect(extractSummary(result.stderr).rest).toMatchSnapshot();
  });

  it('reporter shows more than 1 invocation if test is retried', () => {
    let jsonResult;

    runJest('test-retries', ['--config', reporterConfigJSON, 'retry.test.js']);

    const testOutput = fs.readFileSync(outputFilePath, 'utf8');

    try {
      jsonResult = JSON.parse(testOutput);
    } catch (err: any) {
      throw new Error(
        `Can't parse the JSON result from ${outputFileName}, ${err.toString()}`,
      );
    }

    expect(jsonResult.numPassedTests).toBe(0);
    expect(jsonResult.numFailedTests).toBe(1);
    expect(jsonResult.numPendingTests).toBe(0);
    expect(jsonResult.testResults[0].testResults[0].invocations).toBe(4);
  });

  it('reporter shows 1 invocation if tests are not retried', () => {
    let jsonResult;

    runJest('test-retries', [
      '--config',
      reporterConfigJSON,
      'control.test.js',
    ]);

    const testOutput = fs.readFileSync(outputFilePath, 'utf8');

    try {
      jsonResult = JSON.parse(testOutput);
    } catch (err: any) {
      throw new Error(
        `Can't parse the JSON result from ${outputFileName}, ${err.toString()}`,
      );
    }

    expect(jsonResult.numPassedTests).toBe(0);
    expect(jsonResult.numFailedTests).toBe(1);
    expect(jsonResult.numPendingTests).toBe(0);
    expect(jsonResult.testResults[0].testResults[0].invocations).toBe(1);
  });

  it('tests are not retried if beforeAll hook failure occurs', () => {
    let jsonResult;

    runJest('test-retries', [
      '--config',
      reporterConfigJSON,
      'beforeAllFailure.test.js',
    ]);

    const testOutput = fs.readFileSync(outputFilePath, 'utf8');

    try {
      jsonResult = JSON.parse(testOutput);
    } catch (err: any) {
      throw new Error(
        `Can't parse the JSON result from ${outputFileName}, ${err.toString()}`,
      );
    }

    expect(jsonResult.numPassedTests).toBe(0);
    expect(jsonResult.numFailedTests).toBe(1);
    expect(jsonResult.numPendingTests).toBe(0);
    expect(jsonResult.testResults[0].testResults[0].invocations).toBe(1);
  });

  it('only retries the retryFilter-matching errors', () => {
    let jsonResult;

    runJest('test-retries', [
      '--config',
      reporterConfigJSON,
      'retryFilter.test.js',
    ]);

    const testOutput = fs.readFileSync(outputFilePath, 'utf8');

    try {
      jsonResult = JSON.parse(testOutput);
    } catch (err: any) {
      throw new Error(
        `Can't parse the JSON result from ${outputFileName}, ${err.toString()}`,
      );
    }

    const testResults = jsonResult.testResults[0].testResults;
    const matchingFilterResult = testResults.find(
      (result: any) => result.title === 'matching retry',
    );
    const nonMatchingFilterResult = testResults.find(
      (result: any) => result.title === 'non-matching retry',
    );
    expect(matchingFilterResult.invocations).toBe(4);
    expect(nonMatchingFilterResult.invocations).toBe(1);
  });
});
