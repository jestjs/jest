/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

describe.only("with .only, should show 'passed', 'todo', 'todo'", () => {
  test('passing test', () => {});
  test.todo('todo test 1');
  test.todo('todo test 2');
});
