import runJest from '../run_jest';

jest.mock('jest-util');

jest.mock(
  '../test_scheduler',
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
  '../test_sequencer',
  () =>
    class {
      sort(allTests) {
        return allTests;
      }
      cacheResults() {}
    },
);

jest.mock(
  '../search_source',
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

const config = {roots: [], testPathIgnorePatterns: [], testRegex: ''};
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

    await runJest(
      Object.assign({}, defaults, {
        globalConfig: {
          rootDir: '',
        },
      }),
    );
    expect(globalConfig.collectCoverageFrom).toEqual([
      'foo.js',
      'dont/cover.js',
    ]);
  });

  it('excludes coverage from files outside the global collectCoverageFrom config', async () => {
    expect.assertions(1);

    await runJest(
      Object.assign({}, defaults, {
        globalConfig: {
          collectCoverageFrom: ['**/dont/*.js'],
          rootDir: '',
        },
      }),
    );
    expect(globalConfig.collectCoverageFrom).toEqual(['dont/cover.js']);
  });

  it('respects coveragePathIgnorePatterns', async () => {
    expect.assertions(1);

    await runJest(
      Object.assign({}, defaults, {
        globalConfig: {
          collectCoverageFrom: ['**/*.js'],
          coveragePathIgnorePatterns: ['dont'],
          rootDir: '',
        },
      }),
    );
    expect(globalConfig.collectCoverageFrom).toEqual(['foo.js']);
  });
});
