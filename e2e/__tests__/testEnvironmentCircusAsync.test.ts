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
      "warning: start_describe_definition is a sync event",
      "warning: add_hook is a sync event",
      "warning: add_hook is a sync event",
      "warning: add_test is a sync event",
      "warning: add_test is a sync event",
      "warning: finish_describe_definition is a sync event",
      "add_hook",
      "start_describe_definition",
      "add_hook",
      "add_hook",
      "add_test",
      "add_test",
      "finish_describe_definition",
      "run_start",
      "run_describe_start",
      "run_describe_start",
      "test_start: passing test",
      "hook_start: beforeEach",
      "hook_success: beforeEach",
      "hook_start: beforeEach",
      "hook_success: beforeEach",
      "test_fn_start: passing test",
      "test_fn_success: passing test",
      "hook_start: afterEach",
      "hook_failure: afterEach",
      "test_done: passing test",
      "test_start: failing test",
      "hook_start: beforeEach",
      "hook_success: beforeEach",
      "hook_start: beforeEach",
      "hook_success: beforeEach",
      "test_fn_start: failing test",
      "test_fn_failure: failing test",
      "hook_start: afterEach",
      "hook_failure: afterEach",
      "test_done: failing test",
      "run_describe_finish",
      "run_describe_finish",
      "run_finish",
      "teardown",
    ]
  `);
});
