/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

// Regression test for the leak in #15233: the formatter closes over the test's
// source map cache, so leaving it on `Error.prepareStackTrace` retains it.
test('removes the stack trace formatter once the test file is done', () => {
  const {exitCode, stderr} = runJest('source-map-teardown', ['--no-cache']);

  expect(stderr).not.toContain('was not restored');
  expect(exitCode).toBe(0);
});
