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

  it('retries entire describe blocks after beforeAll failures', () => {
    const result = runJest('test-retries', ['entireDescribeBeforeAll.test.js']);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
  });

  it('restores test snapshots before retrying an entire describe', () => {
    const reporterConfig = {
      reporters: [
        'default',
        ['<rootDir>/reporters/RetryReporter.js', {output: outputFilePath}],
      ],
    };
    const result = runJest('test-retries', [
      '--config',
      JSON.stringify(reporterConfig),
      '__tests__/entireDescribeSnapshot.test.js',
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.stderr).toContain(logErrorsBeforeRetryErrorMessage);
    const jsonResult = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
    expect(jsonResult.testResults[0]).toMatchObject({
      snapshot: {
        matched: 2,
        unmatched: 0,
      },
    });
    expect(
      jsonResult.testResults[0].testResults.map(
        (testResult: {invocations: number}) => testResult.invocations,
      ),
    ).toEqual([2]);
  });

  it('reports late describe retry options at the call site', () => {
    const result = runJest('test-retries', [
      '__tests__/entireDescribeLateRetryTimes.test.js',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.failed).toBe(true);
    expect(result.stderr).toContain(
      'Cannot set retry options after tests have started running. Retry options must be set synchronously.',
    );
    expect(result.stderr).toContain(
      'entireDescribeLateRetryTimes.test.js:10:8',
    );
  });

  it('does not retry or clear delayed errors from outside the describe', () => {
    const reporterConfig = {
      reporters: [
        'default',
        ['<rootDir>/reporters/RetryReporter.js', {output: outputFilePath}],
      ],
    };
    const result = runJest('test-retries', [
      '--config',
      JSON.stringify(reporterConfig),
      '__tests__/entireDescribeDoesNotSwallowOutsideError.test.js',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.failed).toBe(true);
    expect(result.stderr).toContain('outside delayed error');
    const jsonResult = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
    const outsideResult = jsonResult.testResults[0].testResults.find(
      (testResult: {title: string}) =>
        testResult.title === 'schedules an error outside the retried describe',
    );
    const innerResult = jsonResult.testResults[0].testResults.find(
      (testResult: {title: string}) =>
        testResult.title === 'waits while the outside error is raised',
    );
    expect(outsideResult).toMatchObject({invocations: 1, status: 'failed'});
    expect(innerResult).toMatchObject({invocations: 1, status: 'passed'});
  });

  it('does not retry or clear delayed rejections from outside the describe', () => {
    const result = runJest('test-retries', [
      '--waitForUnhandledRejections',
      'entireDescribeDoesNotSwallowOutsideRejection.test.js',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.failed).toBe(true);
    expect(result.stderr).toContain('outside delayed rejection');
  });

  it('does not retry or clear failures from an ancestor describe', () => {
    const reporterConfig = {
      reporters: [
        'default',
        ['<rootDir>/reporters/RetryReporter.js', {output: outputFilePath}],
      ],
    };
    const result = runJest('test-retries', [
      '--ci',
      '--config',
      JSON.stringify(reporterConfig),
      '__tests__/entireDescribeAncestorFailures.test.js',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.failed).toBe(true);
    expect(result.stderr).toContain('outer setup failed');
    expect(result.stderr).toContain('Snapshot: "expected"');
    expect(result.stderr).toContain('Received: "actual"');
    expect(result.stderr).toContain(
      'Expected two assertions to be called but received one assertion call.',
    );
    const jsonResult = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
    expect(
      jsonResult.testResults[0].testResults.map(
        (testResult: {invocations: number}) => testResult.invocations,
      ),
    ).toEqual([1, 1, 1]);
  });

  it('reports failures that an entire describe retry cannot recover', () => {
    const result = runJest('test-retries', [
      'entireDescribeFailureBoundaries.test.js',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.failed).toBe(true);
    expect(result.stderr).toContain('afterAll attempt 1');
    expect(result.stderr).not.toContain('afterAll attempt 2');
    expect(result.stderr).toContain('transient test failure');
    expect(result.stderr).toContain('mixed afterAll attempt 1');
    expect(result.stderr).not.toContain('mixed afterAll attempt 2');
    expect(result.stderr).toContain('persistent beforeAll failure');
    expect(result.stderr).toContain('fails on every attempt');
    expect(result.stderr).toContain('process error after todo');
    expect(result.stderr).toContain('suppressed afterAll expected');
    expect(result.stderr).toContain('suppressed afterAll actual');
  });

  it('takes precedence over global test retries in its subtree', () => {
    const result = runJest('test-retries', [
      '--config',
      JSON.stringify({
        setupFilesAfterEnv: ['<rootDir>/setupGlobalRetry.js'],
      }),
      'entireDescribeGlobalRetry.test.js',
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
  });

  it('composes nested describe retry settings', () => {
    const result = runJest('test-retries', [
      '--config',
      JSON.stringify({
        setupFilesAfterEnv: ['<rootDir>/setupGlobalDescribeRetry.js'],
      }),
      'entireDescribeNestedComposition.test.js',
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
  });

  it('treats zero describe retries as an explicit retry boundary', () => {
    const reporterConfig = {
      reporters: [
        'default',
        ['<rootDir>/reporters/RetryReporter.js', {output: outputFilePath}],
      ],
      setupFilesAfterEnv: ['<rootDir>/setupGlobalRetry.js'],
    };
    const result = runJest('test-retries', [
      '--config',
      JSON.stringify(reporterConfig),
      '__tests__/entireDescribeZeroRetry.test.js',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.failed).toBe(true);
    const jsonResult = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
    expect(jsonResult.testResults[0].testResults[0]).toMatchObject({
      invocations: 1,
      status: 'failed',
    });
  });

  it('retries describes after beforeEach and afterEach failures', () => {
    const result = runJest('test-retries', ['entireDescribeEachHooks.test.js']);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
  });

  it('retries a describe after an owned unhandled rejection', () => {
    const result = runJest('test-retries', [
      '--waitForUnhandledRejections',
      'entireDescribeUnhandledRejection.test.js',
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
  });

  it('reports an unhandled rejection without a test or hook owner', () => {
    const result = runJest('test-retries', [
      '--waitForUnhandledRejections',
      'entireDescribeGlobalUnhandledRejection.test.js',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.failed).toBe(true);
    expect(result.stderr).toContain('global delayed rejection');
  });

  it('retries for a delayed rejection from a nested hook', () => {
    const reporterConfig = {
      reporters: [
        'default',
        ['<rootDir>/reporters/RetryReporter.js', {output: outputFilePath}],
      ],
    };
    const result = runJest('test-retries', [
      '--config',
      JSON.stringify(reporterConfig),
      'entireDescribeNestedHookUnhandledRejection.test.js',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.failed).toBe(true);
    expect(result.stderr).toContain('nested delayed hook rejection');
    const jsonResult = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
    expect(jsonResult.testResults[0].testResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          invocations: 2,
          title: 'finishes before the delayed rejection',
        }),
      ]),
    );
  });

  it('does not retry an unhandled rejection from afterAll cleanup', () => {
    const reporterConfig = {
      reporters: [
        'default',
        ['<rootDir>/reporters/RetryReporter.js', {output: outputFilePath}],
      ],
    };
    const result = runJest('test-retries', [
      '--waitForUnhandledRejections',
      '--config',
      JSON.stringify(reporterConfig),
      'entireDescribeAfterAllUnhandledRejection.test.js',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.failed).toBe(true);
    expect(result.stderr).toContain('afterAll unhandled rejection');
    const jsonResult = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
    expect(jsonResult.testResults[0].testResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          invocations: 1,
          title: 'passes before cleanup fails',
        }),
      ]),
    );
  });

  it('keeps randomized test order stable across describe attempts', () => {
    const result = runJest('test-retries', [
      '--randomize',
      '--seed=1234',
      'entireDescribeRandomize.test.js',
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
  });

  it('attaches entire describe retries to the current describe block', () => {
    const result = runJest('test-retries', ['entireDescribeNested.test.js']);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
  });

  it('waits and logs errors before retrying entire describe blocks', () => {
    const result = runJest('test-retries', ['entireDescribeOptions.test.js']);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.stderr).toContain(logErrorsBeforeRetryErrorMessage);
  });

  it('logs error(s) before retry', () => {
    const result = runJest('test-retries', ['logErrorsBeforeRetries.test.js']);
    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.stderr).toContain(logErrorsBeforeRetryErrorMessage);
    expect(extractSummary(result.stderr).rest).toMatchSnapshot();
  });

  it('logs the inner errors of an AggregateError before retry', () => {
    const result = runJest('test-retries', [
      'logAggregateErrorsBeforeRetries.test.js',
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.stderr).toContain(logErrorsBeforeRetryErrorMessage);
    expect(result.stderr).toContain('Errors contained in AggregateError:');
    expect(result.stderr).not.toContain('[errors]:');
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

  it('reporter shows every invocation when a describe block is retried', () => {
    const reporterConfig = {
      reporters: [
        ['<rootDir>/reporters/RetryReporter.js', {output: outputFilePath}],
      ],
    };

    runJest('test-retries', [
      '--config',
      JSON.stringify(reporterConfig),
      '__tests__/entireDescribe.test.js',
    ]);

    const jsonResult = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
    expect(jsonResult.numPassedTests).toBe(4);
    expect(jsonResult.numFailedTests).toBe(0);
    expect(jsonResult.numPendingTests).toBe(1);
    expect(jsonResult.numTodoTests).toBe(1);
    expect(jsonResult.testResults[0].testResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          invocations: 2,
          title: 'runs passing tests again',
        }),
        expect.objectContaining({
          invocations: 2,
          title: 'retries after a failure',
        }),
      ]),
    );
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

describe('Concurrent Test Retries', () => {
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
    const result = runJest('test-retries', ['e2eConcurrent.test.js']);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.stderr).not.toContain(logErrorsBeforeRetryErrorMessage);
  });

  it('retries concurrent tests with their entire describe block', () => {
    const result = runJest('test-retries', [
      '--maxConcurrency=1',
      'entireDescribeConcurrent.test.js',
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
  });

  it('with flag retryImmediately retry immediately after failed test', () => {
    const logMessage = `console.log
    FIRST TRUTHY TEST

      at Object.log (__tests__/retryImmediatelyConcurrent.test.js:32:11)

  console.log
    SECOND TRUTHY TEST

      at Object.log (__tests__/retryImmediatelyConcurrent.test.js:14:13)

  console.log
    THIRD TRUTHY TEST

      at Object.log (__tests__/retryImmediatelyConcurrent.test.js:25:13)`;

    const result = runJest('test-retries', [
      'retryImmediatelyConcurrent.test.js',
    ]);
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
      '__tests__/retryConcurrent.test.js',
    ]);

    const testOutput = fs.readFileSync(outputFilePath, 'utf8');

    try {
      jsonResult = JSON.parse(testOutput);
    } catch (error: any) {
      throw new Error(
        `Can't parse the JSON result from ${outputFileName}, ${error.toString()}`,
      );
    }

    expect(jsonResult.numPassedTests).toBe(1);
    expect(jsonResult.numFailedTests).toBe(1);
    expect(jsonResult.numPendingTests).toBe(0);
    expect(jsonResult.testResults[0].testResults[0].invocations).toBe(4);
    expect(jsonResult.testResults[0].testResults[1].invocations).toBe(1);
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
      'controlConcurrent.test.js',
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
      'beforeAllFailureConcurrent.test.js',
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
    expect(jsonResult.numFailedTests).toBe(2);
    expect(jsonResult.numPendingTests).toBe(0);
    expect(jsonResult.testResults[0].testResults[0].invocations).toBe(1);
    expect(jsonResult.testResults[0].testResults[1].invocations).toBe(1);
  });
});
