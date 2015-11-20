/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff().mock('fs');

describe('DefaultTestReporter', function() {
  let DefaultTestReporter;

  beforeEach(function() {
    DefaultTestReporter = require('../DefaultTestReporter');
  });

  describe('onTestResult', function() {

    let testReporter;
    let fakeProcess;

    beforeEach(function() {
      fakeProcess = {
        exit: jest.genMockFunction(),
        stdout: {
          write: jest.genMockFunction(),
        },
      };
      testReporter = new DefaultTestReporter(fakeProcess);
    });

    it('Exits with proper error code on bail.', function() {
      const mockAggResults = {
        success: false,
        startTime: 0,
        numTotalTestSuites: 1,
        numPassedTestSuites: 0,
        numFailedTestSuites: 1,
        numRuntimeErrorTestSuites: 0,
        numTotalTests: 1,
        numPassedTests: 0,
        numFailedTests: 1,
        testResults: [],
        postSuiteHeaders: [],
        testFilePath: 'foo',
      };
      testReporter.onRunStart({
        bail: true,
        noHighlight: false,
      }, mockAggResults);
      testReporter.onTestResult({
        bail: true,
        rootDir: 'foo',
      }, mockAggResults, mockAggResults);
      expect(fakeProcess.exit).lastCalledWith(1);
    });

  });
});


