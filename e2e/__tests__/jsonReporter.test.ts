/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import type {FormattedTestResults} from '@jest/test-result';
import runJest from '../runJest';

describe('JSON Reporter', () => {
  const outputFileName = 'sum.result.json';
  const outputFilePath = path.join(
    process.cwd(),
    'e2e/json-reporter/',
    outputFileName,
  );

  afterAll(() => {
    fs.unlinkSync(outputFilePath);
  });

  it('writes test result to sum.result.json', () => {
    let jsonResult: FormattedTestResults;

    runJest('json-reporter', ['--json', `--outputFile=${outputFileName}`]);
    const testOutput = fs.readFileSync(outputFilePath, 'utf8');

    expect(testOutput.endsWith('\n')).toBe(true);

    try {
      jsonResult = JSON.parse(testOutput);
    } catch (err: any) {
      throw new Error(
        `Can't parse the JSON result from ${outputFileName}, ${err.toString()}`,
      );
    }

    expect(jsonResult.numTotalTests).toBe(4);
    expect(jsonResult.numTotalTestSuites).toBe(1);
    expect(jsonResult.numRuntimeErrorTestSuites).toBe(0);
    expect(jsonResult.numPassedTests).toBe(2);
    expect(jsonResult.numFailedTests).toBe(1);
    expect(jsonResult.numPendingTests).toBe(1);

    const noAncestors = jsonResult.testResults[0].assertionResults.find(
      item => item.title == 'no ancestors',
    );
    let expected = {ancestorTitles: [] as Array<string>};
    expect(noAncestors).toEqual(expect.objectContaining(expected));
    expect(noAncestors).toHaveProperty('duration', expect.any(Number));

    const addsNumbers = jsonResult.testResults[0].assertionResults.find(
      item => item.title == 'adds numbers',
    );
    expected = {ancestorTitles: ['sum']};
    expect(addsNumbers).toEqual(expect.objectContaining(expected));
    expect(addsNumbers).toHaveProperty('duration', expect.any(Number));

    const failsTheTest = jsonResult.testResults[0].assertionResults.find(
      item => item.title == 'fails the test',
    );
    expected = {ancestorTitles: ['sum', 'failing tests']};
    expect(failsTheTest).toEqual(expect.objectContaining(expected));
    expect(failsTheTest).toHaveProperty('duration', expect.any(Number));

    const skipedTest = jsonResult.testResults[0].assertionResults.find(
      item => item.title == 'skipped test',
    );
    expect(skipedTest).toHaveProperty('duration', null);
  });

  it('outputs coverage report', () => {
    const result = runJest('json-reporter', ['--json'], {
      keepTrailingNewline: true,
    });
    let jsonResult: FormattedTestResults;

    expect(result.stderr).toMatch(/1 failed, 1 skipped, 2 passed/);
    expect(result.exitCode).toBe(1);

    expect(result.stdout.endsWith('\n')).toBe(true);

    try {
      jsonResult = JSON.parse(result.stdout);
    } catch (err: any) {
      throw new Error(
        `Can't parse the JSON result from stdout${err.toString()}`,
      );
    }

    expect(jsonResult.numTotalTests).toBe(4);
    expect(jsonResult.numTotalTestSuites).toBe(1);
    expect(jsonResult.numRuntimeErrorTestSuites).toBe(0);
    expect(jsonResult.numPassedTests).toBe(2);
    expect(jsonResult.numFailedTests).toBe(1);
    expect(jsonResult.numPendingTests).toBe(1);

    const noAncestors = jsonResult.testResults[0].assertionResults.find(
      item => item.title == 'no ancestors',
    );
    let expected = {ancestorTitles: [] as Array<string>};
    expect(noAncestors).toEqual(expect.objectContaining(expected));

    const addsNumbers = jsonResult.testResults[0].assertionResults.find(
      item => item.title == 'adds numbers',
    );
    expected = {ancestorTitles: ['sum']};
    expect(addsNumbers).toEqual(expect.objectContaining(expected));

    const failsTheTest = jsonResult.testResults[0].assertionResults.find(
      item => item.title == 'fails the test',
    );
    expected = {ancestorTitles: ['sum', 'failing tests']};
    expect(failsTheTest).toEqual(expect.objectContaining(expected));
  });
});
