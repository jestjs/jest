/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const leakStore = [];

/**
 * This exists to force a memory leak in the worker tests.
 */
async function leakMemory() {
  console.log(
    `Intentionally leaking memory: ${(
      process.memoryUsage().heapUsed /
      1024 /
      1024
    ).toFixed(2)}MB at start`,
  );

  let i = Number.MAX_SAFE_INTEGER / 2;
  while (true) {
    i++;

    leakStore.push(i);
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
