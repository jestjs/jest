/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */

globalThis.EXPORT_CONDITIONS_EXPECTED = {
  addon: 'node',
  branch: 'node',
  fallback: 'node',
};

require('./cjs-export-conditions.test.cjs');
