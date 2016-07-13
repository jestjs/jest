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
  Collector: jest.fn(() => ({
    getFinalCoverage: jest.fn(),
  })),
  Reporter: jest.fn(),
  utils: {
    summarizeCoverage: jest.fn(),
  },
}));

let istanbul;
let CoverageReporter;

beforeEach(() => {
  istanbul = require('istanbul');
  CoverageReporter = require('../CoverageReporter');
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

    testReporter = new CoverageReporter();
    testReporter.log = jest.fn();
    istanbul.utils.summarizeCoverage.mockReturnValue(globalResults);
  });

  it('getLastError() returns an error when threshold is not met', () => {
    testReporter.onRunComplete(
      {
        collectCoverage: true,
        coverageThreshold: {
          global: {
            statements: 100,
          },
        },
      },
      mockAggResults,
    );

    expect(testReporter.getLastError()).toBeTruthy();
  });

  it('getLastError() returns `undefined` when threshold is met', () => {
    testReporter.onRunComplete(
      {
        collectCoverage: true,
        coverageThreshold: {
          global: {
            statements: 50,
          },
        },
      },
      mockAggResults,
    );

    expect(testReporter.getLastError()).toBeUndefined();
  });
});
