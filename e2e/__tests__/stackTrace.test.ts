/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {wrap} from 'jest-snapshot-serializer-raw';
import runJest from '../runJest';
import {extractSummary} from '../Utils';

describe('Stack Trace', () => {
  it('prints a stack trace for runtime errors', () => {
    const {exitCode, stdout} = runJest('stack-trace', ['runtimeError.test.js']);

    expect(wrap(extractSummary(stdout).summary)).toMatchSnapshot();

    expect(exitCode).toBe(1);
    expect(stdout).toMatch(
      /ReferenceError: thisIsARuntimeError is not defined/,
    );
    expect(stdout).toMatch(/> 10 \| thisIsARuntimeError\(\);/);
    expect(stdout).toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/runtimeError.test\.js/,
    );
  });

  it('does not print a stack trace for runtime errors when --noStackTrace is given', () => {
    const {exitCode, stdout} = runJest('stack-trace', [
      'runtimeError.test.js',
      '--noStackTrace',
    ]);

    expect(wrap(extractSummary(stdout).summary)).toMatchSnapshot();
    expect(exitCode).toBe(1);

    expect(stdout).toMatch(
      /ReferenceError: thisIsARuntimeError is not defined/,
    );
    expect(stdout).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/runtimeError.test\.js/,
    );
  });

  it('prints a stack trace for matching errors', () => {
    const {exitCode, stdout} = runJest('stack-trace', ['stackTrace.test.js']);

    expect(wrap(extractSummary(stdout).summary)).toMatchSnapshot();
    expect(exitCode).toBe(1);

    expect(stdout).toMatch(/\s+at\s(?:.+?)\s\(__tests__\/stackTrace.test\.js/);
  });

  it('does not print a stack trace for matching errors when --noStackTrace is given', () => {
    const {exitCode, stdout} = runJest('stack-trace', [
      'stackTrace.test.js',
      '--noStackTrace',
    ]);

    expect(wrap(extractSummary(stdout).summary)).toMatchSnapshot();
    expect(exitCode).toBe(1);

    expect(stdout).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/stackTrace.test\.js/,
    );
  });

  it('prints a stack trace for errors', () => {
    const {exitCode, stdout} = runJest('stack-trace', ['testError.test.js']);

    expect(wrap(extractSummary(stdout).summary)).toMatchSnapshot();
    expect(exitCode).toBe(1);

    expect(stdout).toMatch(/this is unexpected\./);
    expect(stdout).toMatch(/this is a string\./);

    expect(stdout).toMatch(/\s+at\s(?:.+?)\s\(__tests__\/testError.test\.js/);

    // Make sure we show Jest's jest-resolve as part of the stack trace
    expect(stdout).toMatch(
      /Cannot find module 'this-module-does-not-exist' from '__tests__\/testError\.test\.js'/,
    );

    expect(stdout).toMatch(
      /\s+at\s(?:.+?)\s\((?:.+?)jest-resolve\/build\/index\.js/,
    );
  });

  it('prints a stack trace for errors without message in stack trace', () => {
    const {exitCode, stdout} = runJest('stack-trace', [
      'stackTraceWithoutMessage.test.js',
    ]);

    expect(wrap(extractSummary(stdout).summary)).toMatchSnapshot();
    expect(exitCode).toBe(1);

    expect(stdout).toMatch(/important message/);
    expect(stdout).toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/stackTraceWithoutMessage.test\.js/,
    );
  });

  it('does not print a stack trace for errors when --noStackTrace is given', () => {
    const {exitCode, stdout} = runJest('stack-trace', [
      'testError.test.js',
      '--noStackTrace',
    ]);

    expect(wrap(extractSummary(stdout).summary)).toMatchSnapshot();
    expect(exitCode).toBe(1);

    expect(stdout).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/testError.test\.js/,
    );
  });
});
