/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {skipSuiteOnJasmine} from '@jest/test-utils';
import runJest from '../runJest';

skipSuiteOnJasmine();

it('calls testEnvironment handleTestEvent', () => {
  const result = runJest('test-environment-circus');
  expect(result.failed).toBe(false);
  expect(result.stdout.split('\n')).toMatchInlineSnapshot(`
    Array [
      "setup",
      "add_hook",
      "add_hook",
      "add_test",
      "add_test",
      "run_start",
      "run_describe_start",
      "test_start: test name here",
      "test_started: test name here",
      "hook_start",
      "hook_success: test name here",
      "hook_start",
      "hook_success: test name here",
      "test_fn_start: test name here",
      "test_fn_success: test name here",
      "test_done: test name here",
      "test_start: second test name here",
      "test_started: second test name here",
      "hook_start",
      "hook_success: second test name here",
      "hook_start",
      "hook_success: second test name here",
      "test_fn_start: second test name here",
      "test_fn_success: second test name here",
      "test_done: second test name here",
      "run_describe_finish",
      "run_finish",
      "teardown",
    ]
  `);
});
