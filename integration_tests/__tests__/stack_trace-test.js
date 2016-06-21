/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const runJest = require('../runJest');

describe('Stack Trace', () => {

  it('prints a stack trace for runtime errors', () => {
    const result = runJest('stack_trace', ['runtime-error-test.js']);
    const stdout = result.stdout.toString();

    expect(stdout).toMatch(
      /1 test suite failed, 0 tests passed/
    );
    expect(result.status).toBe(1);
    expect(stdout).toMatch(
      /ReferenceError: thisIsARuntimeError is not defined/
    );
    expect(stdout).toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/runtime-error-test\.js/
    );
  });

  it('does not print a stack trace for runtime errors when --noStackTrace is given', () => {
    const result = runJest('stack_trace', [
      'runtime-error-test.js',
      '--noStackTrace',
    ]);
    const stdout = result.stdout.toString();

    expect(stdout).toMatch(
      /1 test suite failed, 0 tests passed/
    );
    expect(result.status).toBe(1);

    expect(stdout).toMatch(
      /ReferenceError: thisIsARuntimeError is not defined/
    );
    expect(stdout).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/runtime-error-test\.js/
    );
  });

  it('prints a stack trace for matching errors', () => {
    const result = runJest('stack_trace', ['stack-trace-test.js']);
    const stdout = result.stdout.toString();

    expect(stdout).toMatch(/1 test failed, 0 tests passed/);
    expect(result.status).toBe(1);

    expect(stdout).toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/stack-trace-test\.js/
    );
  });

  it('does not print a stack trace for matching errors when --noStackTrace is given', () => {
    const result = runJest('stack_trace', [
      'stack-trace-test.js',
      '--noStackTrace',
    ]);
    const stdout = result.stdout.toString();

    expect(stdout).toMatch(/1 test failed, 0 tests passed/);
    expect(result.status).toBe(1);

    expect(stdout).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/stack-trace-test\.js/
    );
  });

  it('prints a stack trace for errors', () => {
    const result = runJest('stack_trace', ['test-error-test.js']);
    const stdout = result.stdout.toString();

    expect(stdout).toMatch(/3 tests failed, 0 tests passed/);
    expect(result.status).toBe(1);

    expect(stdout).toMatch(/Error: this is unexpected\./);
    expect(stdout).toMatch(/this is a string\. thrown/);

    expect(stdout).toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/test-error-test\.js/
    );

    // Make sure we show Jest's jest-resolve as part of the stack trace
    /* eslint-disable max-len */
    expect(stdout).toMatch(
      /Error: Cannot find module 'this-module-does-not-exist' from 'test-error-test\.js'/
    );
    /* eslint-enable max-len */

    expect(stdout).toMatch(
      /\s+at\s(?:.+?)\s\((?:.+?)jest-resolve\/build\/index\.js/
    );
  });

  it('does not print a stack trace for errors when --noStackTrace is given', () => {
    const result = runJest('stack_trace', [
      'test-error-test.js',
      '--noStackTrace',
    ]);
    const stdout = result.stdout.toString();

    expect(stdout).toMatch(/3 tests failed, 0 tests passed/);
    expect(result.status).toBe(1);

    expect(stdout).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/test-error-test\.js/
    );
  });

});
