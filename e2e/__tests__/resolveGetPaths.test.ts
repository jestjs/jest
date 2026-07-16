/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('require.resolve.paths', () => {
  const {exitCode} = runJest('resolve-get-paths');
  expect(exitCode).toBe(0);
});
