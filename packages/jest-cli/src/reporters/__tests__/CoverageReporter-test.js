/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .mock('fs')
  .mock('istanbul-lib-coverage')
  .mock('istanbul-lib-source-maps')
  .mock('istanbul-api');

let libCoverage;
let libSourceMaps;
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
  libSourceMaps = require('istanbul-lib-source-maps');
});

describe('onRunComplete', () => {
  let mockAggResults;

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

    libSourceMaps.createSourceMapStore = jest.fn(() => {
      return {
        transformCoverage(map) {
          return {map};
        },
      };
    });
  });

  it('getLastError() returns an error when threshold is not met', () => {
    const testReporter = new CoverageReporter(
      {
        collectCoverage: true,
        coverageThreshold: {
          global: {
            statements: 100,
          },
        },
      },
      {
        maxWorkers: 2,
      },
    );
    testReporter.log = jest.fn();
    return testReporter
      .onRunComplete(new Set(), {}, mockAggResults)
      .then(() => {
        expect(testReporter.getLastError()).toBeTruthy();
      });
  });

  it('getLastError() returns `undefined` when threshold is met', () => {
    const testReporter = new CoverageReporter(
      {
        collectCoverage: true,
        coverageThreshold: {
          global: {
            statements: 50,
          },
        },
      },
      {
        maxWorkers: 2,
      },
    );
    testReporter.log = jest.fn();
    return testReporter
      .onRunComplete(new Set(), {}, mockAggResults)
      .then(() => {
        expect(testReporter.getLastError()).toBeUndefined();
      });
  });
});
