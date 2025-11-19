/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

jest
  .mock('istanbul-lib-source-maps')
  .mock('istanbul-lib-report', () => ({
    ...jest.requireActual('istanbul-lib-report'),
    createContext: jest.fn(),
    summarizers: {pkg: jest.fn(() => ({visit: jest.fn()}))},
  }))
  .mock('istanbul-reports', () => ({
    ...jest.createMockFromModule('istanbul-reports'),
    create: jest.fn(() => ({execute: jest.fn()})),
  }));

let libCoverage;
let libSourceMaps;
let CoverageReporter;
let istanbulReports;

import * as path from 'path';
import mock from 'mock-fs';

beforeEach(() => {
  CoverageReporter = require('../CoverageReporter').default;
  libCoverage = require('istanbul-lib-coverage');
  libSourceMaps = require('istanbul-lib-source-maps');
  istanbulReports = require('istanbul-reports');

  const fileTree = {};
  fileTree[`${process.cwd()}/path-test-files`] = {
    '000pc_coverage_file.js': '',
    '050pc_coverage_file.js': '',
    '100pc_coverage_file.js': '',
    'full_path_file.js': '',
    'glob-path': {
      'file1.js': '',
      'file2.js': '',
    },
    'non_covered_file.js': '',
    'relative_path_file.js': '',
  };
  fileTree[`${process.cwd()}/path-test`] = {
    '100pc_coverage_file.js': '',
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
      const covSummary = {
        branches: {covered: 0, pct: 0, skipped: 0, total: 0},
        functions: {covered: 0, pct: 0, skipped: 0, total: 0},
        lines: {covered: 0, pct: 0, skipped: 0, total: 0},
        statements: {covered: 5, pct: 50, skipped: 0, total: 10},
      };
      const fileCoverage = [
        [
          './path-test/100pc_coverage_file.js',
          {statements: {covered: 10, pct: 100, total: 10}},
        ],
        ['./path-test-files/covered_file_without_threshold.js'],
        ['./path-test-files/full_path_file.js'],
        ['./path-test-files/relative_path_file.js'],
        ['./path-test-files/glob-path/file1.js'],
        ['./path-test-files/glob-path/file2.js'],
        [
          './path-test-files/000pc_coverage_file.js',
          {statements: {covered: 0, pct: 0, total: 10}},
        ],
        [
          './path-test-files/050pc_coverage_file.js',
          {statements: {covered: 5, pct: 50, total: 10}},
        ],
        [
          './path-test-files/100pc_coverage_file.js',
          {statements: {covered: 10, pct: 100, total: 10}},
        ],
      ].reduce((c, f) => {
        const file = path.resolve(f[0]);
        const override = f[1];
        const obj = {...covSummary, ...override};
        c[file] = libCoverage.createCoverageSummary(obj);
        return c;
      }, {});

      return {
        fileCoverageFor(path) {
          if (fileCoverage[path]) {
            return {
              toSummary() {
                return fileCoverage[path];
              },
            };
          } else {
            return undefined;
          }
        },
        files() {
          return Object.keys(fileCoverage);
        },
      };
    });

    libSourceMaps.createSourceMapStore = jest.fn(() => ({
      transformCoverage(map) {
        return Promise.resolve(map);
      },
    }));
  });

  test('getLastError() returns an error when threshold is not met for global', async () => {
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

    await testReporter.onRunComplete(new Set(), mockAggResults);

    expect(testReporter.getLastError().message.split('\n')).toHaveLength(1);
  });

  test('getLastError() returns an error when threshold is not met for file', async () => {
    const covThreshold = {};
    const paths = [
      'global',
      path.resolve(`${process.cwd()}/path-test-files/full_path_file.js`),
      './path-test-files/relative_path_file.js',
      'path-test-files/glob-*/*.js',
    ];
    for (const path of paths) {
      covThreshold[path] = {statements: 100};
    }

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

    await testReporter.onRunComplete(new Set(), mockAggResults);

    expect(testReporter.getLastError().message.split('\n')).toHaveLength(5);
  });

  test('getLastError() returns `undefined` when threshold is met', async () => {
    const covThreshold = {};
    const paths = [
      'global',
      path.resolve(`${process.cwd()}/path-test-files/full_path_file.js`),
      './path-test-files/relative_path_file.js',
      'path-test-files/glob-*/*.js',
    ];
    for (const path of paths) {
      covThreshold[path] = {statements: 50};
    }

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

    await testReporter.onRunComplete(new Set(), mockAggResults);

    expect(testReporter.getLastError()).toBeUndefined();
  });

  test('getLastError() returns an error when threshold is not met for non-covered file', async () => {
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

    await testReporter.onRunComplete(new Set(), mockAggResults);

    expect(testReporter.getLastError().message.split('\n')).toHaveLength(1);
  });

  test('getLastError() returns an error when threshold is not met for directory', async () => {
    const testReporter = new CoverageReporter(
      {
        collectCoverage: true,
        coverageThreshold: {
          './path-test-files/glob-path/': {
            statements: 100,
          },
        },
      },
      {
        maxWorkers: 2,
      },
    );
    testReporter.log = jest.fn();

    await testReporter.onRunComplete(new Set(), mockAggResults);

    expect(testReporter.getLastError().message.split('\n')).toHaveLength(1);
  });

  test('getLastError() returns `undefined` when threshold is met for directory', async () => {
    const testReporter = new CoverageReporter(
      {
        collectCoverage: true,
        coverageThreshold: {
          './path-test-files/glob-path/': {
            statements: 40,
          },
        },
      },
      {
        maxWorkers: 2,
      },
    );
    testReporter.log = jest.fn();

    await testReporter.onRunComplete(new Set(), mockAggResults);

    expect(testReporter.getLastError()).toBeUndefined();
  });

  test('getLastError() returns an error when there is no coverage data for a threshold', async () => {
    const testReporter = new CoverageReporter(
      {
        collectCoverage: true,
        coverageThreshold: {
          './path/doesnt/exist': {
            statements: 40,
          },
        },
      },
      {
        maxWorkers: 2,
      },
    );
    testReporter.log = jest.fn();

    await testReporter.onRunComplete(new Set(), mockAggResults);

    expect(testReporter.getLastError().message.split('\n')).toHaveLength(1);
  });

  test(`getLastError() returns an error when global threshold is not
met by other non matched PATH and GLOB files, even when PATH and GLOB threshold
groups have matched all the files in the coverage data.`, async () => {
    const testReporter = new CoverageReporter(
      {
        collectCoverage: true,
        coverageThreshold: {
          './path-test-files/': {
            statements: 50,
          },
          './path-test/': {
            statements: 100,
          },
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

    await testReporter.onRunComplete(new Set(), mockAggResults);

    // With new behavior, global threshold applies to ALL files
    // Total coverage is ~50.5%, which fails the 100% threshold
    expect(testReporter.getLastError().message.split('\n')).toHaveLength(1);
  });

  test(`getLastError() returns 'undefined' when file and directory path
threshold groups overlap`, async () => {
    const covThreshold = {};
    for (const path of [
      './path-test-files/',
      './path-test-files/covered_file_without_threshold.js',
      './path-test-files/full_path_file.js',
      './path-test-files/relative_path_file.js',
      './path-test-files/glob-path/file1.js',
      './path-test-files/glob-path/file2.js',
      './path-test-files/*.js',
    ]) {
      covThreshold[path] = {
        statements: 0,
      };
    }

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

    await testReporter.onRunComplete(new Set(), mockAggResults);

    expect(testReporter.getLastError()).toBeUndefined();
  });

  test(`that if globs or paths are specified alongside global, global
threshold applies to all files while path/glob thresholds
are applied independently`, async () => {
    const testReporter = new CoverageReporter(
      {
        collectCoverage: true,
        coverageThreshold: {
          './path-test-files/100pc_coverage_file.js': {
            statements: 100,
          },
          './path-test/100pc_coverage_file.js': {
            statements: 100,
          },
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
    // With new behavior, global threshold checks ALL files
    // Total coverage is ~50.5%, which passes the 50% threshold
    await testReporter.onRunComplete(new Set(), mockAggResults);

    expect(testReporter.getLastError()).toBeUndefined();
  });

  test('that files are matched by all matching threshold groups', () => {
    const testReporter = new CoverageReporter(
      {
        collectCoverage: true,
        coverageThreshold: {
          './path-test-files/': {
            statements: 50,
          },
          './path-test-files/050pc_coverage_file.js': {
            statements: 50,
          },
          './path-test-files/100pc_coverage_*.js': {
            statements: 100,
          },
          './path-test-files/100pc_coverage_file.js': {
            statements: 100,
          },
        },
      },
      {
        maxWorkers: 2,
      },
    );
    testReporter.log = jest.fn();
    return testReporter.onRunComplete(new Set(), mockAggResults).then(() => {
      expect(testReporter.getLastError()).toBeUndefined();
    });
  });

  test('that it passes custom options when creating reporters', async () => {
    const testReporter = new CoverageReporter({
      coverageReporters: ['json', ['lcov', {maxCols: 10, projectRoot: './'}]],
    });
    testReporter.log = jest.fn();

    await testReporter.onRunComplete(new Set(), mockAggResults);

    expect(istanbulReports.create).toHaveBeenCalledWith('json', {
      maxCols: process.stdout.columns || Number.POSITIVE_INFINITY,
    });
    expect(istanbulReports.create).toHaveBeenCalledWith('lcov', {
      maxCols: 10,
      projectRoot: './',
    });
    expect(testReporter.getLastError()).toBeUndefined();
  });
});
