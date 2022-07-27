/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let leakStore = '';

/**
 * This exists to force a memory leak in the worker tests.
 */
function leakMemory() {
  while (true) {
    leakStore += '#'.repeat(1000);
  }
}

function fatalExitCode() {
  process.exit(134);
}

function safeFunction() {
  // Doesn't do anything.
}

module.exports = {
  fatalExitCode,
  leakMemory,
  safeFunction,
};
