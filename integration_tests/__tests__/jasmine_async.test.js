/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const runJest = require('../runJest');

describe('async jasmine', () => {
  it('works with beforeAll', () => {
    const result = runJest.json('jasmine_async', [
      'promise_before_all.test.js',
    ]);
    const json = result.json;

    expect(json.numTotalTests).toBe(4);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(3);
    expect(json.numPendingTests).toBe(0);

    const {message} = json.testResults[0];
    expect(message).toMatch('with failing timeout');
    expect(message).toMatch('Async callback was not invoked within timeout');
    expect(message).toMatch('done - with error thrown');
    expect(message).toMatch('done - with error called back');
  });

  it('works with beforeEach', () => {
    const result = runJest.json('jasmine_async', [
      'promise_before_each.test.js',
    ]);
    const json = result.json;

    expect(json.numTotalTests).toBe(3);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(2);
    expect(json.numPendingTests).toBe(0);

    const {message} = json.testResults[0];
    expect(message).toMatch('done - with error thrown');
    expect(message).toMatch('done - with error called back');
  });

  it('works with afterAll', () => {
    const result = runJest.json('jasmine_async', ['promise_after_all.test.js']);
    const json = result.json;

    expect(json.numTotalTests).toBe(2);
    expect(json.numPassedTests).toBe(2);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(0);
    expect(json.testResults[0].message).toBe('');

    expect((result.stderr.match(/unset flag/g) || []).length).toBe(1);
  });

  it('works with afterEach', () => {
    const result = runJest.json('jasmine_async', [
      'promise_after_each.test.js',
    ]);
    const json = result.json;

    expect(json.numTotalTests).toBe(2);
    expect(json.numPassedTests).toBe(2);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(0);
    expect(json.testResults[0].message).toBe('');
  });

  it('works with fit', () => {
    const result = runJest.json('jasmine_async', ['promise_fit.test.js']);
    const json = result.json;

    expect(json.numTotalTests).toBe(3);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(1);
    expect(json.numPendingTests).toBe(1);
    expect(json.testResults[0].message).toMatch(/will run and fail/);
  });

  it('works with xit', () => {
    const result = runJest.json('jasmine_async', ['promise_xit.test.js']);
    const json = result.json;

    expect(json.numTotalTests).toBe(2);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(1);
  });

  it('throws when not a promise is returned', () => {
    const result = runJest.json('jasmine_async', ['returning_values.test.js']);
    const json = result.json;

    expect(json.numTotalTests).toBe(11);
    expect(json.numPassedTests).toBe(0);
    expect(json.numFailedTests).toBe(11);
    expect(json.numPendingTests).toBe(0);
  });

  it('tests async promise code', () => {
    const result = runJest.json('jasmine_async', ['promise_it.test.js']);
    const json = result.json;
    const message = json.testResults[0].message;

    expect(json.numTotalTests).toBe(16);
    expect(json.numPassedTests).toBe(6);
    expect(json.numFailedTests).toBe(9);

    expect(message).toMatch('fails if promise is rejected');
    expect(message).toMatch('works with done.fail');
    expect(message).toMatch('works with done(error)');
    expect(message).toMatch('fails if failed expectation with done');
    expect(message).toMatch('fails if failed expectation with done - async');
    expect(message).toMatch('fails with thrown error with done - sync');
    expect(message).toMatch('fails with thrown error with done - async');
    expect(message).toMatch('fails a sync test');
    expect(message).toMatch('fails if a custom timeout is exceeded');
  });

  it('works with concurrent', () => {
    const result = runJest.json('jasmine_async', ['concurrent.test.js']);
    const json = result.json;
    expect(json.numTotalTests).toBe(4);
    expect(json.numPassedTests).toBe(2);
    expect(json.numFailedTests).toBe(1);
    expect(json.numPendingTests).toBe(1);
    expect(json.testResults[0].message).toMatch(/concurrent test fails/);
  });
});
