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
  it('prints a usable stack trace even if no Error.captureStackTrace', () => {
    const result = runJest('stack_trace_no_captureStackTrace');
    const stderr = result.stderr.toString();

    const assertErrorLines = stderr.split('\n').slice(3, 9);

    expect(result.status).toBe(1);

    expect(stderr).toMatch(/\s+at\sJestAssertionError\s.*/);

    expect(assertErrorLines).toEqual([
      '    expect(received).toBe(expected)',
      '    ',
      '    Expected value to be (using ===):',
      '      2',
      '    Received:',
      '      1',
    ]);
  });
});
