/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const fs = require('fs');
const path = require('path');
const runJest = require('../runJest');

const ConditionalTest = require('../../scripts/ConditionalTest');

ConditionalTest.skipSuiteOnJasmine();

describe('Test Retries', () => {
  const outputFileName = 'retries.result.json';
  const outputFilePath = path.join(
    process.cwd(),
    'e2e/test-retries/',
    outputFileName,
  );

  afterAll(() => {
    fs.unlinkSync(outputFilePath);
  });

  it('retries failed tests if configured', () => {
    let jsonResult;

    const reporterConfig = {
      reporters: [
        ['<rootDir>/reporters/RetryReporter.js', {output: outputFilePath}],
      ],
    };

    runJest('test-retries', [
      '--config',
      JSON.stringify(reporterConfig),
      'retry.test.js',
    ]);

    const testOutput = fs.readFileSync(outputFilePath, 'utf8');

    try {
      jsonResult = JSON.parse(testOutput);
    } catch (err) {
      throw new Error(
        `Can't parse the JSON result from ${outputFileName}, ${err.toString()}`,
      );
    }

    expect(jsonResult.numPassedTests).toBe(0);
    expect(jsonResult.numFailedTests).toBe(1);
    expect(jsonResult.numPendingTests).toBe(0);
    expect(jsonResult.testResults[0].testResults[0].invocations).toBe(4);
  });

  it('does not retry by default', () => {
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
    } catch (err) {
      throw new Error(
        `Can't parse the JSON result from ${outputFileName}, ${err.toString()}`,
      );
    }

    expect(jsonResult.numPassedTests).toBe(0);
    expect(jsonResult.numFailedTests).toBe(1);
    expect(jsonResult.numPendingTests).toBe(0);
    expect(jsonResult.testResults[0].testResults[0].invocations).toBe(1);
  });
});
