/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Top-level await forces the async-evaluate fallback even on the v24.9+ sync path.
const resolved = await Promise.resolve('tla-value');
export const value = resolved;
