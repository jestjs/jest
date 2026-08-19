/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {skipSuiteOnJasmine} from '@jest/test-utils';
import runJest from '../runJest';
import {
  extractSummary,
  replaceJestBuildLineNumbers,
  replaceNodeInfo,
  replaceRepoRoot,
} from '../Utils';

skipSuiteOnJasmine();

test('prints useful error for requires after test is done w/o `waitForUnhandledRejections`', () => {
  const {exitCode, stderr} = runJest('require-after-teardown');

  const {rest} = extractSummary(stderr);
  const normalized = replaceRepoRoot(
    replaceJestBuildLineNumbers(replaceNodeInfo(rest)),
  );
  expect(exitCode).toBe(1);
  expect(normalized).toMatchSnapshot();
  expect(stderr).toContain('(__tests__/lateRequire.test.js:11:20)');
  // The stray timer throws once the run has already reported, and nothing
  // formatted a stack from this file earlier, so line 13 — rather than the
  // transformed file's line 12 — only appears if the source map registry
  // outlived teardown.
  expect(stderr).toContain('lateRequire.test.js:13:12');
});

test('prints useful error for requires after test is done w/ `waitForUnhandledRejections`', () => {
  const {exitCode, stderr} = runJest('require-after-teardown', [
    '--waitForUnhandledRejections',
  ]);

  const {rest} = extractSummary(stderr);
  const normalized = replaceRepoRoot(
    replaceJestBuildLineNumbers(replaceNodeInfo(rest)),
  );
  expect(exitCode).toBe(1);
  expect(normalized).toMatchSnapshot();
  expect(stderr).toContain('(__tests__/lateRequire.test.js:11:20)');
});
