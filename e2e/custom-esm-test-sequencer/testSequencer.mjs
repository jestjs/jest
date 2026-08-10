/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Sequencer from '@jest/test-sequencer';

export default class CustomSequencer extends Sequencer {
  sort(tests) {
    const copyTests = [...tests];
    return copyTests.sort((testA, testB) => (testA.path > testB.path ? 1 : -1));
  }
}
