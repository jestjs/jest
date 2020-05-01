/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('supports NODE_PATH', () => {
  const result = runJest('node-path', [], {
    nodePath: '../node-path/src',
  });
  expect(result.exitCode).toBe(0);
});
