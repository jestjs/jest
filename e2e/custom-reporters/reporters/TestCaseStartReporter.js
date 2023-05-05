/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

/**
 * @class
 * @implements {import('@jest/reporters').Reporter}
 */
class TestCaseStartReporter {
  onTestCaseStart(test, testCaseStartInfo) {
    const mode =
      testCaseStartInfo.mode != null ? testCaseStartInfo.mode : 'undefined';
    console.log(
      `onTestCaseStart: ${testCaseStartInfo.title}, ` +
        `mode: ${mode}, ` +
        `ancestorTitles: ${testCaseStartInfo.ancestorTitles.join('.')}`,
    );
  }
}

module.exports = TestCaseStartReporter;
