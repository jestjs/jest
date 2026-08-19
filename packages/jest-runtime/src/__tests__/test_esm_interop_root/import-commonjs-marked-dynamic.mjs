/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Deliberately not top-level await: a TLA graph is rejected by the sync
// loader before the dynamic import runs, which is the path under test.
// eslint-disable-next-line unicorn/prefer-top-level-await
export const importResult = import('commonjs-marked').then(
  () => 'loaded-as-esm',
  error => error,
);
