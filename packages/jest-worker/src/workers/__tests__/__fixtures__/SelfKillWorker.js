/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const {isMainThread} = require('worker_threads');

async function selfKill() {
  // This test is intended for the child process worker. If the Node.js worker
  // thread mode is accidentally tested instead, let's prevent a confusing
  // situation where process.kill stops the Jest test harness itself.
  if (!isMainThread) {
    // process.exit is documented to only stop the current thread rather than
    // the process in a worker_threads environment.
    process.exit();
  }

  process.kill(process.pid);
}

module.exports = {
  selfKill,
};
