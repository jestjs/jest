/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {wrap} from 'jest-snapshot-serializer-raw';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

describe('Stack Trace', () => {

  it('does not print a stack trace for runtime errors when --noStackTrace is given', () => {
    const {exitCode, stderr} = runJest('stack-trace', [
      'runtimeError.test.js',
      '--noStackTrace',
    ]);

    expect(wrap(extractSummary(stderr).summary)).toMatchSnapshot();
    expect(exitCode).toBe(1);

    expect(stderr).toMatch(
      /ReferenceError: thisIsARuntimeError is not defined/,
    );
    expect(stderr).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/runtimeError.test\.js/,
    );
  });


  it('does not print a stack trace for matching errors when --noStackTrace is given', () => {
    const {exitCode, stderr} = runJest('stack-trace', [
      'stackTrace.test.js',
      '--noStackTrace',
    ]);

    expect(wrap(extractSummary(stderr).summary)).toMatchSnapshot();
    expect(exitCode).toBe(1);

    expect(stderr).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/stackTrace.test\.js/,
    );
  });

  it('does not print a stack trace for errors when --noStackTrace is given', () => {
    const {exitCode, stderr} = runJest('stack-trace', [
      'testError.test.js',
      '--noStackTrace',
    ]);

    expect(wrap(extractSummary(stderr).summary)).toMatchSnapshot();
    expect(exitCode).toBe(1);

    expect(stderr).not.toMatch(
      /\s+at\s(?:.+?)\s\(__tests__\/testError.test\.js/,
    );
  });
});
