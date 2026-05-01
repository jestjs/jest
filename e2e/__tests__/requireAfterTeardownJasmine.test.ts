/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {skipSuiteOnJestCircus} from '@jest/test-utils';
import runJest from '../runJest';
import {
  replaceJestBuildLineNumbers,
  replaceNodeVersion,
  replaceTime,
} from '../Utils';

skipSuiteOnJestCircus();

test.each`
  jestArgs
  ${[]}
  ${['--waitForUnhandledRejections']}
`('prints useful error for requires after test is done', ({jestArgs}) => {
  const {stderr} = runJest('require-after-teardown', jestArgs);

  const normalized = replaceJestBuildLineNumbers(
    replaceNodeVersion(replaceTime(stderr)),
  );
  expect(normalized).toMatchSnapshot();
  expect(stderr).toContain('(__tests__/lateRequire.test.js:11:20)');
});
