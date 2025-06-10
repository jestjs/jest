/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {skipSuiteOnJasmine} from '@jest/test-utils';
import runJest from '../runJest';

skipSuiteOnJasmine();

test('prints useful error for requires after test is done w/o `waitForUnhandledRejections`', () => {
  const {stderr} = runJest('require-after-teardown');

  const interestingLines = stderr.split('\n').slice(9, 18).join('\n');

  expect(interestingLines).toMatchSnapshot();
  expect(stderr.split('\n')[19]).toMatch(
    '(__tests__/lateRequire.test.js:11:20)',
  );
});

test('prints useful error for requires after test is done w/ `waitForUnhandledRejections`', () => {
  const {stderr} = runJest('require-after-teardown', [
    '--waitForUnhandledRejections',
  ]);

  const interestingLines = stderr.split('\n').slice(5, 14).join('\n');

  expect(interestingLines).toMatchSnapshot();
  expect(stderr.split('\n')[16]).toMatch(
    '(__tests__/lateRequire.test.js:11:20)',
  );
});
