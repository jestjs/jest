/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);

/** @type {import('jest').Config} */
export default {
  rootDir: '.',
  roots: ['<rootDir>/e2e/__tests__'],
  testMatch: ['<rootDir>/e2e/__tests__/browser*.test.ts'],
  testTimeout: 70_000,
  transform: {
    '\\.[jt]sx?$': require.resolve('babel-jest'),
  },
};
