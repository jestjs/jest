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

jest
  .mock('fs')
  .mock('istanbul-lib-coverage')
  .mock('istanbul-api');

let libCoverage;
let CoverageReporter;
let istanbulApi;

beforeEach(() => {
  istanbulApi = require('istanbul-api');
  istanbulApi.createReporter = jest.fn(() => ({
    addAll: jest.fn(),
    write: jest.fn(),
  }));

  CoverageReporter = require('../CoverageReporter');
  libCoverage = require('istanbul-lib-coverage');
});

describe('onRunComplete', () => {
  let mockAggResults;
  let testReporter;

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

    libCoverage.createCoverageMap = jest.fn(() => {
      return {
        getCoverageSummary() {
          return {
            toJSON() {
              return {
                branches: {total: 0, covered: 0, skipped: 0, pct: 0},
                functions: {total: 0, covered: 0, skipped: 0, pct: 0},
                lines: {total: 0, covered: 0, skipped: 0, pct: 0},
                statements: {total: 0, covered: 0, skipped: 0, pct: 50},
              };
            },
          };
        },
      };
    });

    testReporter = new CoverageReporter();
    testReporter.log = jest.fn();
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
