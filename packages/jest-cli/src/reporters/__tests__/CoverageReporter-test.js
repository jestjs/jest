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
      numFailedTestSuites: 0,
      numFailedTests: 0,
      numPassedTestSuites: 1,
      numPassedTests: 1,
      numPendingTests: 0,
      numRuntimeErrorTestSuites: 0,
      numTotalTestSuites: 1,
      numTotalTests: 1,
      startTime: 0,
      success: true,
      testFilePath: 'foo',
      testResults: [],
    };

    libCoverage.createCoverageMap = jest.fn(() => {
      return {
        getCoverageSummary() {
          return {
            toJSON() {
              return {
                branches: {covered: 0, pct: 0, skipped: 0, total: 0},
                functions: {covered: 0, pct: 0, skipped: 0, total: 0},
                lines: {covered: 0, pct: 0, skipped: 0, total: 0},
                statements: {covered: 0, pct: 50, skipped: 0, total: 0},
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
