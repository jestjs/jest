/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
module.exports = class NoShardingSequencer {
  shard(tests) {
    return [
      Array.from(tests).sort((a, b) =>
        a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
      )[2],
    ];
  }
  sort(tests) {
    return tests;
  }
};
