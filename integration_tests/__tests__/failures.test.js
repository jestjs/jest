/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const path = require('path');
const skipOnWindows = require('skipOnWindows');
const {extractSummary} = require('../utils');
const runJest = require('../runJest');

const dir = path.resolve(__dirname, '../failures');

const normalizeDots = text => text.replace(/\.{1,}$/gm, '.');

skipOnWindows.suite();

const cleanupStackTrace = stderr => {
  const STACK_REGEXP = /^.*at.*(setup-jest-globals|extractExpectedAssertionsErrors).*\n/gm;
  if (!STACK_REGEXP.test(stderr)) {
    throw new Error(
      `
      This function is used to remove inconsistent stack traces between
      jest-jasmine2 and jest-circus. If you see this error, that means the
      stack traces are no longer inconsistent and this function can be
      safely removed.

      output:
      ${stderr}
    `,
    );
  }

  return (
    stderr
      .replace(STACK_REGEXP, '')
      // Also remove trailing whitespace.
      .replace(/\s+$/gm, '')
  );
};

test('not throwing Error objects', () => {
  let stderr;
  stderr = runJest(dir, ['throw_number.test.js']).stderr;
  expect(extractSummary(stderr).rest).toMatchSnapshot();
  stderr = runJest(dir, ['throw_string.test.js']).stderr;
  expect(extractSummary(stderr).rest).toMatchSnapshot();
  stderr = runJest(dir, ['throw_object.test.js']).stderr;
  expect(extractSummary(stderr).rest).toMatchSnapshot();
  stderr = runJest(dir, ['assertion_count.test.js']).stderr;
  expect(extractSummary(cleanupStackTrace(stderr)).rest).toMatchSnapshot();
});

test('works with node assert', () => {
  const {stderr} = runJest(dir, ['node_assertion_error.test.js']);
  expect(normalizeDots(extractSummary(stderr).rest)).toMatchSnapshot();
});
