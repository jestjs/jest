/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const runJest = require('../runJest');
const {escapePathForRegex} = require('jest-util');

describe('Stack Trace', () => {
  beforeEach(() => {
    jasmine.addMatchers({
      toContainPath(util, customEqualityTesters) {
        return {
          compare(actual, expected) {
            const path = escapePathForRegex(expected);
            const regex = new RegExp('\\s+at\\s(?:.+?)\\s\\(' + path);
            return {
              pass: regex.test(actual),
              message: 'Result does not contain "' + expected + '": ' + actual,
            };
          },
        };
      },
    });
  });

  it('prints a stack trace for runtime errors', () => {
    const result = runJest('stack_trace', ['runtime-error-test.js']);
    const stderr = result.stderr.toString();

    expect(stderr).toMatch(
      /1 test suite failed, 0 tests passed/
    );
    expect(result.status).toBe(1);
    expect(stderr).toMatch(
      /ReferenceError: thisIsARuntimeError is not defined/
    );
    expect(stderr).toContainPath('__tests__/runtime-error-test.js');
  });

  it('does not print a stack trace for runtime errors when --noStackTrace is given', () => {
    const result = runJest('stack_trace', [
      'runtime-error-test.js',
      '--noStackTrace',
    ]);
    const stderr = result.stderr.toString();

    expect(stderr).toMatch(
      /1 test suite failed, 0 tests passed/
    );
    expect(result.status).toBe(1);

    expect(stderr).toMatch(
      /ReferenceError: thisIsARuntimeError is not defined/
    );
    expect(stderr).not.toContainPath('__tests__/runtime-error-test.js');
  });

  it('prints a stack trace for matching errors', () => {
    const result = runJest('stack_trace', ['stack-trace-test.js']);
    const stderr = result.stderr.toString();

    expect(stderr).toMatch(/1 test failed, 0 tests passed/);
    expect(result.status).toBe(1);

    expect(stderr).toContainPath('__tests__/stack-trace-test.js');
  });

  it('does not print a stack trace for matching errors when --noStackTrace is given', () => {
    const result = runJest('stack_trace', [
      'stack-trace-test.js',
      '--noStackTrace',
    ]);
    const stderr = result.stderr.toString();

    expect(stderr).toMatch(/1 test failed, 0 tests passed/);
    expect(result.status).toBe(1);

    expect(stderr).not.toContainPath('__tests__/stack-trace-test.js');
  });

  it('prints a stack trace for errors', () => {
    const result = runJest('stack_trace', ['test-error-test.js']);
    const stderr = result.stderr.toString();

    expect(stderr).toMatch(/3 tests failed, 0 tests passed/);
    expect(result.status).toBe(1);

    expect(stderr).toMatch(/this is unexpected\./);
    expect(stderr).toMatch(/this is a string\. thrown/);

    expect(stderr).toContainPath('__tests__/test-error-test.js');

    // Make sure we show Jest's jest-resolve as part of the stack trace
    /* eslint-disable max-len */
    expect(stderr).toMatch(
      /Cannot find module 'this-module-does-not-exist' from 'test-error-test\.js'/
    );
    /* eslint-enable max-len */

    const path = escapePathForRegex('jest-resolve/build/index.js');
    expect(stderr).toMatch(
      new RegExp('\\s+at\\s(?:.+?)\\s\\((?:.+?)' + path)
    );
  });

  it('does not print a stack trace for errors when --noStackTrace is given', () => {
    const result = runJest('stack_trace', [
      'test-error-test.js',
      '--noStackTrace',
    ]);
    const stderr = result.stderr.toString();

    expect(stderr).toMatch(/3 tests failed, 0 tests passed/);
    expect(result.status).toBe(1);

    expect(stderr).not.toContainPath('__tests__/test-error-test.js');
  });

});
