/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('runs so that the environment can check the teardown', () => {
  expect(new Error('mapped').stack).toContain('passes.test.js');
});
