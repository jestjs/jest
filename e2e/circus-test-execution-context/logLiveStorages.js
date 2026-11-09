/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Before Node 24, every enabled `AsyncLocalStorage` stamps its own
// `kResourceStore` symbol onto each promise created afterwards.
module.exports = () => {
  const count = Object.getOwnPropertySymbols(Promise.resolve()).filter(
    symbol => symbol.description === 'kResourceStore',
  ).length;
  console.log(`live storages: ${count}`);
};
