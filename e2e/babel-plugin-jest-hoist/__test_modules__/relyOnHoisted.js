/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Captured at module-init time. If `jest.hoisted` does NOT hoist its
// factory above this import, the value will be `undefined`.
export const observedAtImport = globalThis.__jestHoistedValue__;
