/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('supports instanceof Promise', () => {
  const {exitCode} = runJest('mock-functions');

  expect(exitCode).toBe(0);
});
