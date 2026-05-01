/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Exercises the `importModuleDynamically` callback path.
export async function loadA() {
  const mod = await import('./a.mjs');
  return mod.fromA;
}
