/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Sequencer = require('@jest/test-sequencer').default;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class CustomSequencer extends Sequencer {
  async sort(tests) {
    await sleep(50);
    const copyTests = [...tests];
    return copyTests.sort((testA, testB) => (testA.path > testB.path ? 1 : -1));
  }

  async allFailedTests(tests) {
    await sleep(50);
    return tests.filter(
      t => t.path.endsWith('c.test.js') || t.path.endsWith('d.test.js'),
    );
  }
}

module.exports = CustomSequencer;
