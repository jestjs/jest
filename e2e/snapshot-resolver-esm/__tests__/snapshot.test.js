/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('snapshots are written using an ESM resolver', () => {
  expect('esm-resolver').toMatchSnapshot();
});
