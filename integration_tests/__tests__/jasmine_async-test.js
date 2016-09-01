/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const runJest = require('../runJest');

describe('async jasmine', () => {
  it('works with beforeEach', () => {
    const result = runJest.json(
      'jasmine_async',
      ['promise_beforeEach-test.js'],
    );
    const json = result.json;

    expect(json.numTotalTests).toBe(1);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(0);
    expect(json.testResults[0].message).toBe('');
  });

  it('works with afterEach', () => {
    const result = runJest.json('jasmine_async', ['promise_afterEach-test.js']);
    const json = result.json;

    expect(json.numTotalTests).toBe(2);
    expect(json.numPassedTests).toBe(2);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(0);
    expect(json.testResults[0].message).toBe('');
  });

  it('works with fit', () => {
    const result = runJest.json('jasmine_async', ['promise_fit-test.js']);
    const json = result.json;

    expect(json.numTotalTests).toBe(3);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(1);
    expect(json.numPendingTests).toBe(1);
    expect(json.testResults[0].message).toMatch(/will run and fail/);
  });

  it('works with xit', () => {
    const result = runJest.json('jasmine_async', ['promise_xit-test.js']);
    const json = result.json;

    expect(json.numTotalTests).toBe(2);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(1);
  });

  it('throws when not a promise is returned', () => {
    const result = runJest.json('jasmine_async', ['returning_values-test.js']);
    const json = result.json;

    expect(json.numTotalTests).toBe(11);
    expect(json.numPassedTests).toBe(0);
    expect(json.numFailedTests).toBe(11);
    expect(json.numPendingTests).toBe(0);
  });

  it('tests async promise code', () => {
    const result = runJest.json('jasmine_async', ['promise_it-test.js']);
    const json = result.json;
    const message = json.testResults[0].message;

    expect(json.numTotalTests).toBe(7);
    expect(json.numPassedTests).toBe(4);
    expect(json.numFailedTests).toBe(3);

    expect(message).toMatch('fails if promise is rejected');
    expect(message).toMatch('works with done.fail');
    expect(message).toMatch('fails a sync test');
  });

  it('works with pit', () => {
    const result = runJest.json('jasmine_async', ['pit-test.js']);
    const json = result.json;
    expect(json.numTotalTests).toBe(2);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(1);
    expect(json.testResults[0].message).toMatch(/will run and fail/);
  });
});
