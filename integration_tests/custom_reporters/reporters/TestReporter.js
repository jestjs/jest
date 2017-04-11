/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * TestReporter
 * Reporter for testing the outputs, without any extra 
 * hassle. Uses a JSON like syntax for testing the reporters
 * instead of outputting the text to stdout and using match functions 
 * to get the output.
 */
class TestReporter {
  constructor(options) {
    this._options = options;

    /**
     * statsCollected property
     * contains most of the statistics 
     * related to the object to be called,
     * This here helps us in avoiding the string match
     * statements nothing else
     */
    this._statsCollected = {
      onRunComplete: {},
      onRunStart: {},
      onTestResult: {times: 0},
      onTestStart: {},
      options,
    };
  }

  /**
   * clearLine
   * clears the line for easier JSON parsing
   */
  clearLine() {
    if (process.stdout.isTTY) {
      process.stderr.write('\x1b[999D\x1b[K');
    }
  }

  onTestStart(config, path) {
    const onTestStart = this._statsCollected.onTestStart;

    onTestStart.called = true;
    onTestStart.config = config === undefined;
    onTestStart.path = typeof path === 'string';
  }

  onTestResult(config, testResult, results) {
    const onTestResult = this._statsCollected.onTestResult;

    onTestResult.called = true;
    onTestResult.times++;
  }

  onRunStart(config, results, options) {
    this.clearLine();
    const onRunStart = this._statsCollected.onRunStart;

    onRunStart.called = true;
    onRunStart.config = typeof config;
    onRunStart.options = typeof options;
  }

  onRunComplete(config, results) {
    const onRunComplete = this._statsCollected.onRunComplete;

    onRunComplete.called = true;
    onRunComplete.config = typeof config;

    onRunComplete.numPassedTests = results.numPassedTests;
    onRunComplete.numFailedTests = results.numFailedTests;
    onRunComplete.numTotalTests = results.numTotalTests;

    // The Final Call
    process.stdout.write(JSON.stringify(this._statsCollected, null, 4));
  }
}

module.exports = TestReporter;
