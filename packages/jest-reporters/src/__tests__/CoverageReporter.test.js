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
  }))
  .mock('../CoverageWorker', () => ({
    worker: jest.fn(),
  }));

let libCoverage;
let libSourceMaps;
let CoverageReporter;
let CoverageWorker;
let istanbulReports;

import * as path from 'path';
import mock from 'mock-fs';

beforeEach(() => {
  jest.clearAllMocks();
  CoverageReporter = require('../CoverageReporter').default;
  CoverageWorker = require('../CoverageWorker');
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
        addFileCoverage: jest.fn(),
        data: {},
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

  test('getLastError() returns an error when threshold is not met for global', () => {
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

  test('getLastError() returns an error when threshold is not met for file', () => {
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
    return testReporter
      .onRunComplete(new Set(), {}, mockAggResults)
      .then(() => {
        expect(testReporter.getLastError().message.split('\n')).toHaveLength(5);
      });
  });

  test('getLastError() returns `undefined` when threshold is met', () => {
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
    return testReporter
      .onRunComplete(new Set(), {}, mockAggResults)
      .then(() => {
        expect(testReporter.getLastError()).toBeUndefined();
      });
  });

  test('getLastError() returns an error when threshold is not met for non-covered file', () => {
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

  test('getLastError() returns an error when threshold is not met for directory', () => {
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
    return testReporter
      .onRunComplete(new Set(), {}, mockAggResults)
      .then(() => {
        expect(testReporter.getLastError().message.split('\n')).toHaveLength(1);
      });
  });

  test('getLastError() returns `undefined` when threshold is met for directory', () => {
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
    return testReporter
      .onRunComplete(new Set(), {}, mockAggResults)
      .then(() => {
        expect(testReporter.getLastError()).toBeUndefined();
      });
  });

  test('getLastError() returns an error when there is no coverage data for a threshold', () => {
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
    return testReporter
      .onRunComplete(new Set(), {}, mockAggResults)
      .then(() => {
        expect(testReporter.getLastError().message.split('\n')).toHaveLength(1);
      });
  });

  test(`getLastError() returns 'undefined' when global threshold group
   is empty because PATH and GLOB threshold groups have matched all the
    files in the coverage data.`, () => {
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
    return testReporter
      .onRunComplete(new Set(), {}, mockAggResults)
      .then(() => {
        expect(testReporter.getLastError()).toBeUndefined();
      });
  });

  test(`getLastError() returns 'undefined' when file and directory path
  threshold groups overlap`, () => {
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
    return testReporter
      .onRunComplete(new Set(), {}, mockAggResults)
      .then(() => {
        expect(testReporter.getLastError()).toBeUndefined();
      });
  });

  test(`that if globs or paths are specified alongside global, coverage
  data for matching paths will be subtracted from overall coverage
  and thresholds will be applied independently`, () => {
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
    // 100% coverage file is removed from overall coverage so
    // coverage drops to < 50%
    return testReporter
      .onRunComplete(new Set(), {}, mockAggResults)
      .then(() => {
        expect(testReporter.getLastError().message.split('\n')).toHaveLength(1);
      });
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
    return testReporter
      .onRunComplete(new Set(), {}, mockAggResults)
      .then(() => {
        expect(testReporter.getLastError()).toBeUndefined();
      });
  });

  test('that it passes custom options when creating reporters', () => {
    const testReporter = new CoverageReporter({
      coverageReporters: ['json', ['lcov', {maxCols: 10, projectRoot: './'}]],
    });
    testReporter.log = jest.fn();
    return testReporter
      .onRunComplete(new Set(), {}, mockAggResults)
      .then(() => {
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

  test('collects untested files from project config when running multiple projects', () => {
    const projectConfig = {
      collectCoverageFrom: ['src/**/*.js'],
      rootDir: '/project-a',
    };
    const hasteFS = {
      matchFilesWithGlob: jest
        .fn()
        .mockReturnValue(new Set(['/project-a/src/untested.js'])),
    };
    CoverageWorker.worker.mockResolvedValue(undefined);

    const testReporter = new CoverageReporter(
      {
        collectCoverage: true,
        collectCoverageFrom: [],
        coverageReporters: [],
        maxWorkers: 1,
      },
      {},
    );

    return testReporter
      .onRunComplete(
        new Set([{config: projectConfig, hasteFS}]),
        mockAggResults,
      )
      .then(() => {
        expect(hasteFS.matchFilesWithGlob).toHaveBeenCalledWith(
          projectConfig.collectCoverageFrom,
          projectConfig.rootDir,
        );
        expect(CoverageWorker.worker).toHaveBeenCalledWith(
          expect.objectContaining({
            config: projectConfig,
            globalConfig: expect.objectContaining({collectCoverageFrom: []}),
            path: '/project-a/src/untested.js',
          }),
        );
        expect(testReporter.getLastError()).toBeUndefined();
      });
  });

  test('deduplicates untested files matched by global and project coverage globs', () => {
    const collectCoverageFrom = ['src/**/*.js'];
    const projectConfig = {
      collectCoverageFrom,
      rootDir: '/project-a',
    };
    const hasteFS = {
      matchFilesWithGlob: jest
        .fn()
        .mockReturnValue(new Set(['/project-a/src/untested.js'])),
    };
    CoverageWorker.worker.mockResolvedValue(undefined);

    const testReporter = new CoverageReporter(
      {
        collectCoverage: true,
        collectCoverageFrom,
        coverageReporters: [],
        maxWorkers: 1,
      },
      {},
    );

    return testReporter
      .onRunComplete(
        new Set([{config: projectConfig, hasteFS}]),
        mockAggResults,
      )
      .then(() => {
        expect(hasteFS.matchFilesWithGlob).toHaveBeenCalledTimes(2);
        expect(CoverageWorker.worker).toHaveBeenCalledTimes(1);
        expect(CoverageWorker.worker).toHaveBeenCalledWith(
          expect.objectContaining({
            config: projectConfig,
            path: '/project-a/src/untested.js',
          }),
        );
        expect(testReporter.getLastError()).toBeUndefined();
      });
  });
});
