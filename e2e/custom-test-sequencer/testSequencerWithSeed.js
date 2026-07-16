/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  constructor(_options) {
    super(_options);
    this.globalConfig = _options.globalConfig;
  }

  sort(tests) {
    const copyTests = [...tests];
    const seed = this.globalConfig.seed;
    const sortedTests = copyTests.sort((testA, testB) =>
      testA.path > testB.path ? 1 : -1,
    );

    if (seed % 2 === 0) {
      return sortedTests;
    } else {
      return sortedTests.reverse();
    }
  }
}

module.exports = CustomSequencer;
