/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

/* eslint-disable jest/no-focused-tests */

const skipOnWindows = {
  suite() {
    if (process.platform === 'win32') {
      fit('does not work on Windows', () => {
        console.warn('[SKIP] Does not work on Windows');
      });
    }
  },

  test() {
    if (process.platform === 'win32') {
      console.warn('[SKIP] Does not work on Windows');
      return true;
    }
    return false;
  },
};

module.exports = skipOnWindows;
