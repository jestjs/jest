/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable jest/no-focused-tests */

'use strict';

describe.only("with .only, should show 'passed', 'todo', 'todo'", () => {
  test('passing test', () => {});
  test.todo('todo test 1');
  test.todo('todo test 2');
});
