/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    return new Promise(resolve => {
      setTimeout(() => {
        const copyTests = Array.from(tests);
        resolve(
          copyTests.sort((testA, testB) => (testA.path > testB.path ? 1 : -1)),
        );
      }, 50);
    });
  }
}

module.exports = CustomSequencer;
