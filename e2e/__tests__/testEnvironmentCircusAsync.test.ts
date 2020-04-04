/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {skipSuiteOnJasmine} from '@jest/test-utils';
import runJest from '../runJest';

skipSuiteOnJasmine();

it('calls asynchronous handleTestEvent in testEnvironment', () => {
  const result = runJest('test-environment-circus-async');
  expect(result.failed).toEqual(true);

  const lines = result.stdout.split('\n');
  expect(lines).toMatchInlineSnapshot(`
    Array [
      "setup",
      "warning: add_hook is a sync event",
      "warning: add_hook is a sync event",
      "warning: add_hook is a sync event",
      "warning: add_test is a sync event",
      "warning: add_test is a sync event",
      "add_hook",
      "add_hook",
      "add_hook",
      "add_test",
      "add_test",
      "run_start",
      "run_describe_start",
      "test_start: test name here",
      "hook_start: beforeEach",
      "hook_success: beforeEach",
      "hook_start: beforeEach",
      "hook_success: beforeEach",
      "test_fn_start: test name here",
      "test_fn_success: test name here",
      "hook_start: afterEach",
      "hook_success: afterEach",
      "test_done: test name here",
      "test_start: second test name here",
      "hook_start: beforeEach",
      "hook_success: beforeEach",
      "hook_start: beforeEach",
      "hook_success: beforeEach",
      "test_fn_start: second test name here",
      "test_fn_failure: second test name here",
      "hook_start: afterEach",
      "hook_success: afterEach",
      "test_done: second test name here",
      "run_describe_finish",
      "run_finish",
      "teardown",
    ]
  `);
});
