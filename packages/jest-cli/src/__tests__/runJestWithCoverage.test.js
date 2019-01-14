// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

import runJest from '../runJest';

jest.mock('jest-util', () => {
  const util = jest.requireActual('jest-util');
  return {
    ...jest.genMockFromModule('jest-util'),
    replacePathSepForGlob: util.replacePathSepForGlob,
  };
});

jest.mock(
  '../TestScheduler',
  () =>
    class {
      constructor(globalConfig) {
        this._globalConfig = globalConfig;
      }

      scheduleTests() {
        return {_globalConfig: this._globalConfig};
      }
    },
);

jest.mock(
  '../TestSequencer',
  () =>
    class {
      sort(allTests) {
        return allTests;
      }
      cacheResults() {}
    },
);

jest.mock(
  '../SearchSource',
  () =>
    class {
      constructor(context) {
        this._context = context;
      }

      async getTestPaths(globalConfig, changedFilesPromise) {
        const {files} = await changedFilesPromise;
        const paths = files.filter(path => path.match(/__tests__/));

        return {
          collectCoverageFrom: files.filter(path => !path.match(/__tests__/)),
          tests: paths.map(path => ({
            context: this._context,
            duration: null,
            path,
          })),
        };
      }
    },
);

const config = {roots: [], testPathIgnorePatterns: [], testRegex: []};
let globalConfig;
const defaults = {
  changedFilesPromise: Promise.resolve({
    files: ['foo.js', '__tests__/foo-test.js', 'dont/cover.js'],
  }),
  contexts: [{config}],
  onComplete: runResults => (globalConfig = runResults._globalConfig),
  outputStream: {},
  startRun: {},
  testWatcher: {isInterrupted: () => false},
};

describe('collectCoverageFrom patterns', () => {
  it('should apply collectCoverageFrom patterns coming from SearchSource', async () => {
    expect.assertions(1);

    await runJest({
      ...defaults,
      globalConfig: {
        rootDir: '',
      },
    });
    expect(globalConfig.collectCoverageFrom).toEqual([
      'foo.js',
      'dont/cover.js',
    ]);
  });

  it('excludes coverage from files outside the global collectCoverageFrom config', async () => {
    expect.assertions(1);

    await runJest({
      ...defaults,
      globalConfig: {
        collectCoverageFrom: ['**/dont/*.js'],
        rootDir: '',
      },
    });
    expect(globalConfig.collectCoverageFrom).toEqual(['dont/cover.js']);
  });

  it('respects coveragePathIgnorePatterns', async () => {
    expect.assertions(1);

    await runJest({
      ...defaults,
      globalConfig: {
        collectCoverageFrom: ['**/*.js'],
        coveragePathIgnorePatterns: ['dont'],
        rootDir: '',
      },
    });
    expect(globalConfig.collectCoverageFrom).toEqual(['foo.js']);
  });
});
