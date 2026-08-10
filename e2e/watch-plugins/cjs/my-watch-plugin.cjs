/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
class MyWatchPlugin {
  // Add hooks to Jest lifecycle events
  apply(jestHooks) {}

  // Get the prompt information for interactive plugins
  getUsageInfo(globalConfig) {
    console.log('getUsageInfo');
  }

  // Executed when the key from `getUsageInfo` is input
  run(globalConfig, updateConfigAndRun) {}
}

module.exports = MyWatchPlugin;
