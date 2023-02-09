/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {Worker} = require('worker_threads');

test('something', () => {
  const worker = new Worker(require.resolve('../interval-code'), {
    stderr: true,
    stdout: true,
  });
  worker.unref();
  expect(true).toBe(true);
});
