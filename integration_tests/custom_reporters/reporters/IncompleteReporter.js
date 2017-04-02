/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * IncompleteReporter
 * Reporter to test for the flexibility of the interface we implemented.
 * The reporters shouldn't be required to implement all the methods
 * 
 * This only implements one mehtod onRunComplete which should be called
 */
class IncompleteReporter {
  constructor(options) {
    this.options = {};
  }

  onRunComplete(config, results) {
    console.log('onRunComplete is called');
    console.log('Passed Tests: ' + results.numPassedTests);
    console.log('Failed Tests: ' + results.numFailedTests);
    console.log('Total Tests: ' + results.numTotalTests);
  }
}

module.exports = IncompleteReporter;
