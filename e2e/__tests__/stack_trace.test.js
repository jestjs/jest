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
const {extractSummary} = require('../Utils');

describe('Stack Trace', () => {
  it('prints a stack trace for runtime errors', () => {
    const {status, stderr} = runJest('stack-trace', ['runtime_error.test.js']);

    expect(extractSummary(stderr).summary).toMatchSnapshot();

    expect(status).toBe(1);
    expect(stderr).toMatch(
      /ReferenceError: thisIsARuntimeError is not defined/,
    );
    expect(stderr).toMatch(/> 10 \| thisIsARuntimeError\(\);/);
    expect(stderr).toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/runtime_error.test\.js/,
    );
  });

  it('does not print a stack trace for runtime errors when --noStackTrace is given', () => {
    const {status, stderr} = runJest('stack-trace', [
      'runtime_error.test.js',
      '--noStackTrace',
    ]);

    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(status).toBe(1);

    expect(stderr).toMatch(
      /ReferenceError: thisIsARuntimeError is not defined/,
    );
    expect(stderr).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/runtime_error.test\.js/,
    );
  });

  it('prints a stack trace for matching errors', () => {
    const {status, stderr} = runJest('stack-trace', ['stack_trace.test.js']);

    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(status).toBe(1);

    expect(stderr).toMatch(/\s+at\s(?:.+?)\s\(__tests__\/stack_trace.test\.js/);
  });

  it('does not print a stack trace for matching errors when --noStackTrace is given', () => {
    const {status, stderr} = runJest('stack-trace', [
      'stack_trace.test.js',
      '--noStackTrace',
    ]);

    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(status).toBe(1);

    expect(stderr).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/stack_trace.test\.js/,
    );
  });

  it('prints a stack trace for errors', () => {
    const {status, stderr} = runJest('stack-trace', ['test_error.test.js']);

    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(status).toBe(1);

    expect(stderr).toMatch(/this is unexpected\./);
    expect(stderr).toMatch(/this is a string\./);

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
    const {status, stderr} = runJest('stack-trace', [
      'stack_trace_without_message.test.js',
    ]);

    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(status).toBe(1);

    expect(stderr).toMatch(/important message/);
    expect(stderr).toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/stack_trace_without_message.test\.js/,
    );
  });

  it('does not print a stack trace for errors when --noStackTrace is given', () => {
    const {status, stderr} = runJest('stack-trace', [
      'test_error.test.js',
      '--noStackTrace',
    ]);

    expect(extractSummary(stderr).summary).toMatchSnapshot();
    expect(status).toBe(1);

    expect(stderr).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/test_error.test\.js/,
    );
  });
});
