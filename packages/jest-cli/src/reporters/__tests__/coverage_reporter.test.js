/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

jest
  .mock('istanbul-lib-coverage')
  .mock('istanbul-lib-source-maps')
  .mock('istanbul-api');

let libCoverage;
let libSourceMaps;
let CoverageReporter;
let istanbulApi;

import path from 'path';
import mock from 'mock-fs';

beforeEach(() => {
  istanbulApi = require('istanbul-api');
  istanbulApi.createReporter = jest.fn(() => ({
    addAll: jest.fn(),
    write: jest.fn(),
  }));

  CoverageReporter = require('../coverage_reporter').default;
  libCoverage = require('istanbul-lib-coverage');
  libSourceMaps = require('istanbul-lib-source-maps');

  const fileTree = {};
  fileTree[process.cwd() + '/path-test-files'] = {
    'full_path_file.js': '',
    'glob-path': {
      'file1.js': '',
      'file2.js': '',
    },
    'non_covered_file.js': '',
    'relative_path_file.js': '',
  };

  mock(fileTree);
});

afterEach(() => {
  mock.restore();
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
      const files = [
        './path-test-files/covered_file_without_threshold.js',
        './path-test-files/full_path_file.js',
        './path-test-files/relative_path_file.js',
        './path-test-files/glob-path/file1.js',
        './path-test-files/glob-path/file2.js',
      ].map(p => path.resolve(p));

      return {
        fileCoverageFor(path) {
          if (files.indexOf(path) !== -1) {
            const covSummary = {
              branches: {covered: 0, pct: 0, skipped: 0, total: 0},
              functions: {covered: 0, pct: 0, skipped: 0, total: 0},
              lines: {covered: 0, pct: 0, skipped: 0, total: 0},
              merge(other) {
                return covSummary;
              },
              statements: {covered: 0, pct: 50, skipped: 0, total: 0},
            };
            return {
              toSummary() {
                return covSummary;
              },
            };
          } else {
            return undefined;
          }
        },
        files() {
          return files;
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

  it('getLastError() returns an error when threshold is not met for global', () => {
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
        expect(testReporter.getLastError().message.split('\n')).toHaveLength(1);
      });
  });

  it('getLastError() returns an error when threshold is not met for file', () => {
    const covThreshold = {};
    [
      'global',
      path.resolve(`${process.cwd()}/path-test-files/full_path_file.js`),
      './path-test-files/relative_path_file.js',
      'path-test-files/glob-*/*.js',
    ].forEach(path => {
      covThreshold[path] = {
        statements: 100,
      };
    });

    const testReporter = new CoverageReporter(
      {
        collectCoverage: true,
        coverageThreshold: covThreshold,
      },
      {
        maxWorkers: 2,
      },
    );
    testReporter.log = jest.fn();
    return testReporter
      .onRunComplete(new Set(), {}, mockAggResults)
      .then(() => {
        expect(testReporter.getLastError().message.split('\n')).toHaveLength(5);
      });
  });

  it('getLastError() returns `undefined` when threshold is met', () => {
    const covThreshold = {};
    [
      'global',
      path.resolve(`${process.cwd()}/path-test-files/full_path_file.js`),
      './path-test-files/relative_path_file.js',
      'path-test-files/glob-*/*.js',
    ].forEach(path => {
      covThreshold[path] = {
        statements: 50,
      };
    });

    const testReporter = new CoverageReporter(
      {
        collectCoverage: true,
        coverageThreshold: covThreshold,
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

  it('getLastError() returns an error when threshold is for non-covered file', () => {
    const testReporter = new CoverageReporter(
      {
        collectCoverage: true,
        coverageThreshold: {
          'path-test-files/non_covered_file.js': {
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
        expect(testReporter.getLastError().message.split('\n')).toHaveLength(1);
      });
  });
});
