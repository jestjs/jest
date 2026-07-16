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

test('prints useful error for imports after test is done w/o `waitForUnhandledRejections`', () => {
  const {exitCode, stderr} = runJest('import-after-teardown', [], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  const {rest} = extractSummary(stderr);
  const normalized = replaceRepoRoot(
    replaceJestBuildLineNumbers(replaceNodeInfo(rest)),
  );
  expect(exitCode).toBe(1);
  expect(normalized).toMatchSnapshot();
  expect(stderr).toContain('(__tests__/lateImport.test.mjs:10:');
});

test('prints useful error for imports after test is done w/ `waitForUnhandledRejections`', () => {
  const {exitCode, stderr} = runJest(
    'import-after-teardown',
    ['--waitForUnhandledRejections'],
    {nodeOptions: '--experimental-vm-modules --no-warnings'},
  );

  const {rest} = extractSummary(stderr);
  const normalized = replaceRepoRoot(
    replaceJestBuildLineNumbers(replaceNodeInfo(rest)),
  );
  expect(exitCode).toBe(1);
  expect(normalized).toMatchSnapshot();
  expect(stderr).toContain('(__tests__/lateImport.test.mjs:10:');
});
