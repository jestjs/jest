/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const {isMainThread} = require('worker_threads');

async function selfKill() {
  if (!isMainThread) {
    // process.exit is documented to only stop the current thread rather than
    // the entire process in a worker_threads environment.
    process.exit();
  }

  process.kill(process.pid);
}

module.exports = {
  selfKill,
};
