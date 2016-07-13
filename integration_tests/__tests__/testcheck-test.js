/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.unmock('../runJest');

const runJest = require('../runJest');

describe('testcheck', () => {
  it('works', () => {
    const result = runJest.json('testcheck', ['testcheck-test.js']);
    const json = result.json;

    expect(json.numTotalTests).toBe(3);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(1);
    expect(json.numPendingTests).toBe(1);
  });

  it('runs "fit" tests exclusively', () => {
    const result = runJest.json('testcheck', ['testcheck-fit-test.js']);
    const json = result.json;

    expect(json.numTotalTests).toBe(3);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(2);
  });

  it('merges in testcheck options', () => {
    const result = runJest.json('testcheck', [
      'testcheck-options-test.js',
      '--testcheckSeed', '0',
      '--testcheckTimes', '5',
      '--testcheckMaxSize', '2',
    ]);
    const json = result.json;
    const output = result.stderr.toString();

    expect(json.numTotalTests).toBe(4);
    expect(json.numPassedTests).toBe(4);

    expect(output).toMatch(/An array: \[ 1, 9, -5, 4, 3, 8 \]/);
    expect(output).toMatch(/runCountWithoutOverride: 5/);
    expect(output).toMatch(/runCountWithOverride: 1/);
  });

  it('reports exceptions', () => {
    const result = runJest('testcheck', ['testcheck-exceptions-test.js']);
    expect(result.status).toBe(1);
    expect(result.stderr.toString()).toMatch(
      /Error: This error should be reported/
    );
  });
});
