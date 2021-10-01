/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('suite with `instanceof` checks', () => {
  const {exitCode} = runJest('instanceof');

  expect(exitCode).toBe(0);
});
