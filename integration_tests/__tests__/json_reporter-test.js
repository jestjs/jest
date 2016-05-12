/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const runJest = require('../runJest');

describe('JSON Reporter', () => {
  it('outputs coverage report', () => {
    const result = runJest('json_reporter', ['--json']);
    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();
    let jsonResult;

    expect(stderr).toMatch(/1 test failed, 1 test passed/);
    expect(result.status).toBe(1);

    try {
      jsonResult = JSON.parse(stdout);
    } catch (err) {
      throw new Error(
        'Can\'t parse the JSON result from stdout' + err.toString()
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
