/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const fs = require('fs');
const path = require('path');
const runJest = require('../runJest');

describe('JSON Reporter', () => {
  const outputFileName = 'sum.result.json';
  const outputFilePath = path.join(
    process.cwd(),
    'integration_tests/json_reporter/',
    outputFileName,
  );

  afterAll(() => {
    fs.unlinkSync(outputFilePath);
  });

  it('writes test result to sum.result.json', () => {
    let jsonResult;

    runJest('json_reporter', ['--json', `--outputFile=${outputFileName}`]);
    const testOutput = fs.readFileSync(outputFilePath, 'utf8');

    try {
      jsonResult = JSON.parse(testOutput);
    } catch (err) {
      throw new Error(
        `Can't parse the JSON result from ${outputFileName}, ${err.toString()}`,
      );
    }

    expect(jsonResult.numTotalTests).toBe(2);
    expect(jsonResult.numTotalTestSuites).toBe(1);
    expect(jsonResult.numRuntimeErrorTestSuites).toBe(0);
    expect(jsonResult.numPassedTests).toBe(1);
    expect(jsonResult.numFailedTests).toBe(1);
    expect(jsonResult.numPendingTests).toBe(0);
  });

  it('outputs coverage report', () => {
    const result = runJest('json_reporter', ['--json']);
    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();
    let jsonResult;

    expect(stderr).toMatch(/1 failed, 1 passed/);
    expect(result.status).toBe(1);

    try {
      jsonResult = JSON.parse(stdout);
    } catch (err) {
      throw new Error(
        "Can't parse the JSON result from stdout" + err.toString(),
      );
    }

    expect(jsonResult.numTotalTests).toBe(2);
    expect(jsonResult.numTotalTestSuites).toBe(1);
    expect(jsonResult.numRuntimeErrorTestSuites).toBe(0);
    expect(jsonResult.numPassedTests).toBe(1);
    expect(jsonResult.numFailedTests).toBe(1);
    expect(jsonResult.numPendingTests).toBe(0);
  });
});
