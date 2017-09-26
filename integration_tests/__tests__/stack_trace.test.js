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
const {extractSummary} = require('../utils');

describe('Stack Trace', () => {
  it('prints a stack trace for runtime errors', () => {
    const result = runJest('stack_trace', ['runtime_error.test.js']);
    const stderr = result.stderr.toString();

    expect(extractSummary(stderr).summary).toMatchSnapshot();

    expect(result.status).toBe(1);
    expect(stderr).toMatch(
      /ReferenceError: thisIsARuntimeError is not defined/,
    );
    expect(stderr).toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/runtime_error.test\.js/,
    );
  });

  it('does not print a stack trace for runtime errors when --noStackTrace is given', () => {
    const result = runJest('stack_trace', [
      'runtime_error.test.js',
      '--noStackTrace',
    ]);
    const stderr = result.stderr.toString();

    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(result.status).toBe(1);

    expect(stderr).toMatch(
      /ReferenceError: thisIsARuntimeError is not defined/,
    );
    expect(stderr).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/runtime_error.test\.js/,
    );
  });

  it('prints a stack trace for matching errors', () => {
    const result = runJest('stack_trace', ['stack_trace.test.js']);
    const stderr = result.stderr.toString();

    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(result.status).toBe(1);

    expect(stderr).toMatch(/\s+at\s(?:.+?)\s\(__tests__\/stack_trace.test\.js/);
  });

  it('does not print a stack trace for matching errors when --noStackTrace is given', () => {
    const result = runJest('stack_trace', [
      'stack_trace.test.js',
      '--noStackTrace',
    ]);
    const stderr = result.stderr.toString();

    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(result.status).toBe(1);

    expect(stderr).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/stack_trace.test\.js/,
    );
  });

  it('prints a stack trace for errors', () => {
    const result = runJest('stack_trace', ['test_error.test.js']);
    const stderr = result.stderr.toString();

    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(result.status).toBe(1);

    expect(stderr).toMatch(/this is unexpected\./);
    expect(stderr).toMatch(/this is a string\. thrown/);

    expect(stderr).toMatch(/\s+at\s(?:.+?)\s\(__tests__\/test_error.test\.js/);

    // Make sure we show Jest's jest-resolve as part of the stack trace
    expect(stderr).toMatch(
      /Cannot find module 'this-module-does-not-exist' from 'test_error.test\.js'/,
    );

    expect(stderr).toMatch(
      /\s+at\s(?:.+?)\s\((?:.+?)jest-resolve\/build\/index\.js/,
    );
  });

  it('prints a stack trace for errors without message in stack trace', () => {
    const result = runJest('stack_trace', [
      'stack_trace_without_message.test.js',
    ]);
    const stderr = result.stderr.toString();

    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(result.status).toBe(1);

    expect(stderr).toMatch(/important message/);
    expect(stderr).toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/stack_trace_without_message.test\.js/,
    );
  });

  it('does not print a stack trace for errors when --noStackTrace is given', () => {
    const result = runJest('stack_trace', [
      'test_error.test.js',
      '--noStackTrace',
    ]);
    const stderr = result.stderr.toString();

    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(result.status).toBe(1);

    expect(stderr).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/test_error.test\.js/,
    );
  });
});
