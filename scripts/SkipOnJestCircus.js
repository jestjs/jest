/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable jest/no-focused-tests */

const SkipOnJestCircus = {
  isJestCircusRun() {
    return process.env.JEST_CIRCUS === '1';
  },

  suite() {
    if (process.env.JEST_CIRCUS === '1') {
      fit('does not work on jest-circus', () => {
        console.warn('[SKIP] Does not work on jest-circus');
      });
    }
  },
};

module.exports = SkipOnJestCircus;
