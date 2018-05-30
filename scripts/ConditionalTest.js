/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable jest/no-focused-tests */

const ConditionalTest = {
  isJestCircusRun() {
    return process.env.JEST_CIRCUS === '1';
  },

  skipSuiteOnJasmine() {
    if (!this.isJestCircusRun()) {
      fit('does not work on Jasmine', () => {
        console.warn('[SKIP] Does not work on Jasmine');
      });
    }
  },

  skipSuiteOnJestCircus() {
    if (this.isJestCircusRun()) {
      fit('does not work on jest-circus', () => {
        console.warn('[SKIP] Does not work on jest-circus');
      });
    }
  },

  skipSuiteOnWindows() {
    if (process.platform === 'win32') {
      fit('does not work on Windows', () => {
        console.warn('[SKIP] Does not work on Windows');
      });
    }
  },
};

module.exports = ConditionalTest;
