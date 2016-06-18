/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.disableAutomock().mock('fs');
jest.mock('istanbul', () => ({
  Collector: jest.fn().mockImplementation(() => ({
    getFinalCoverage: jest.fn(),
  })),
  Reporter: jest.fn(),
  utils: {
    summarizeCoverage: jest.fn(),
  },
}));

let istanbul;
let IstanbulTestReporter;

describe('InstanbulTestReporter', () => {

  beforeEach(() => {
    istanbul = require('istanbul');
    IstanbulTestReporter = require('../IstanbulTestReporter');
  });

  describe('onRunComplete', () => {

    let mockAggResults;
    let testReporter;
    const globalResults = {
      statements: {
        pct: 50,
      },
      branches: {
        pct: 0,
      },
      lines: {
        pct: 0,
      },
      functions: {
        pct: 0,
      },
    };

    beforeEach(() => {
      mockAggResults = {
        success: true,
        startTime: 0,
        numTotalTestSuites: 1,
        numPassedTestSuites: 1,
        numFailedTestSuites: 0,
        numRuntimeErrorTestSuites: 0,
        numTotalTests: 1,
        numPassedTests: 1,
        numPendingTests: 0,
        numFailedTests: 0,
        testResults: [],
        testFilePath: 'foo',
      };
      const fakeProcess = {
        exit: jest.fn(),
        stdout: {
          write: jest.fn(),
        },
      };
      testReporter = new IstanbulTestReporter(fakeProcess);
      istanbul.utils.summarizeCoverage.mockReturnValue(globalResults);

    });

    it('Sets results success to false on threshold fail', () => {
      const success = testReporter.onRunComplete({
        collectCoverage: true,
        coverageThreshold: {
          global: {
            statements: 100,
          },
        },
      }, mockAggResults);
      expect(success).toBe(false);
    });

    it('Should return success when threshold is met', () => {
      const success = testReporter.onRunComplete({
        collectCoverage: true,
        coverageThreshold: {
          global: {
            statements: 50,
          },
        },
      }, mockAggResults);
      expect(success).toBe(true);
    });

  });
});
