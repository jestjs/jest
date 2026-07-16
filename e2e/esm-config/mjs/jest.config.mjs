/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const displayName = await Promise.resolve('Config from mjs file');

export default {
  displayName,
  testEnvironment: 'node',
  testEnvironmentOptions: {
    globalsCleanup: 'on',
  },
};
