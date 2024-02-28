/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test.failing('snapshots not updated', () => {
  expect('1').toMatchSnapshot();
  expect('1').toMatchSnapshot();
});
