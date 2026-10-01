/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment jsdom
 */

globalThis.EXPORT_CONDITIONS_EXPECTED = {
  addon: 'default',
  branch: 'browser',
  fallback: 'default',
};

require('./cjs-export-conditions.test.cjs');
