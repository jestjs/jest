/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('jest-worker killed', async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
});

setTimeout(() => {
  // Self-kill process.
  process.kill(process.pid);
}, 50);
