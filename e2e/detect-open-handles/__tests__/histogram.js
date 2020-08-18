/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const perf_hooks = require('perf_hooks');

test('something', () => {
  try {
    perf_hooks.monitorEventLoopDelay({}).enable();
  } catch {
    // node version <11.10.0
  }
  expect(true).toBe(true);
});
