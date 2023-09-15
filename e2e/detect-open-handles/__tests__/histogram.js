/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const {monitorEventLoopDelay} = require('node:perf_hooks');

test('something', () => {
  const histogram = monitorEventLoopDelay();
  histogram.enable();
  expect(true).toBe(true);
});
