/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {TestPathPatternsExecutor} from '@jest/pattern';
import type {TestContext} from '@jest/test-result';
import type {Config} from '@jest/types';
import {getTestPathMatcher} from 'jest-config';
import {replacePathSepForRegex} from 'jest-regex-util';
import SearchSource from '../SearchSource';
import type {Stats} from '../types';

type MatchingConfig = Pick<
  Config.ProjectConfig,
  'roots' | 'testMatch' | 'testPathIgnorePatterns' | 'testRegex'
>;

/**
 * The fixtures below are written with posix paths because that is how the
 * recorded counts below were measured. `roots` are matched with the native
 * separator and the ignore/regex patterns are normalised by `jest-config`
 * before matching, so the fixtures are mapped onto the current platform the
 * same way `normalize` would have done it. On posix the mapping is a no-op.
 */
const isWindows = process.platform === 'win32';
const toPlatformPath = (posixPath: string) =>
  isWindows ? `C:${posixPath.replaceAll('/', '\\')}` : posixPath;
const toPlatformGlob = (posixGlob: string) =>
  isWindows && posixGlob.startsWith('/') ? `C:${posixGlob}` : posixGlob;
const toPlatformPattern = (pattern: string | RegExp): string => {
  if (typeof pattern !== 'string') {
    throw new TypeError('the fixtures below only use string patterns');
  }
  return replacePathSepForRegex(pattern);
};
const toPlatformConfig = (config: MatchingConfig): MatchingConfig => ({
  roots: config.roots.map(toPlatformPath),
  testMatch: config.testMatch.map(toPlatformGlob),
  testPathIgnorePatterns: config.testPathIgnorePatterns.map(toPlatformPattern),
  testRegex: config.testRegex.map(toPlatformPattern),
});

const paths = [
  '/project/a.test.js',
  '/project',
  '/project/',
  '/project/src/a.test.js',
  '/project/src/a.js',
  '/project/src/a.spec.js',
  '/project/src/a.spec.ts',
  '/project/__tests__/a.js',
  '/project/__tests__/nested/deep/a.jsx',
  '/project/node_modules/pkg/a.test.js',
  '/project/src/node_modules/a.test.js',
  '/project/__mocks__/a.test.js',
  '/project/legacy/a.test.js',
  '/project/legacy/a.js',
  '/project/src/a.skip.js',
  '/project/packages/a/src/thing.test.js',
  '/project/packages/a/src/legacy/thing.test.js',
  '/project/packages/a/thing.test.js',
  '/project/packages/b/src/thing.spec.ts',
  '/project/packages/b/lib/thing.test.js',
  '/project/packages/b/node_modules/pkg/thing.test.js',
  '/project/packages/c/src/thing.test.js',
  '/project/packages/b/__fixtures__/thing.test.js',
  '/project2/a.test.js',
  '/other/a.test.js',
  '/other/src/a.test.js',
  '/some/deep/random/file.txt',
];

const platformPaths = paths.map(toPlatformPath);

const noRules = {
  testMatch: [],
  testPathIgnorePatterns: [],
  testRegex: [],
};

/**
 * The counts below were recorded from `SearchSource` before the matching rules
 * were extracted into `jest-config` (see `getTestPathMatcher`). `tests` is the
 * number of paths `findMatchingTests` selects, `stats` the per-option counts
 * `--listTests` reports.
 */
const matrix: Array<{
  name: string;
  config: MatchingConfig;
  tests: number;
  stats: Stats;
}> = [
  {
    config: {roots: ['/project'], ...noRules},
    name: 'roots',
    stats: {
      roots: 22,
      testMatch: 0,
      testPathIgnorePatterns: 0,
      testRegex: 0,
    },
    tests: 22,
  },
  {
    config: {roots: ['/project/packages/a', '/project/packages/b'], ...noRules},
    name: 'multiple roots',
    stats: {
      roots: 7,
      testMatch: 0,
      testPathIgnorePatterns: 0,
      testRegex: 0,
    },
    tests: 7,
  },
  {
    config: {roots: [], ...noRules},
    name: 'empty roots',
    stats: {
      roots: 27,
      testMatch: 0,
      testPathIgnorePatterns: 0,
      testRegex: 0,
    },
    tests: 27,
  },
  {
    config: {
      roots: ['/project'],
      testMatch: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
      ],
      testPathIgnorePatterns: [],
      testRegex: [],
    },
    name: 'testMatch, Jest defaults',
    stats: {
      roots: 22,
      testMatch: 21,
      testPathIgnorePatterns: 0,
      testRegex: 0,
    },
    tests: 18,
  },
  {
    config: {
      roots: ['/project'],
      testMatch: ['/project/**/*.spec.js'],
      testPathIgnorePatterns: [],
      testRegex: [],
    },
    name: 'testMatch, absolute glob',
    stats: {
      roots: 22,
      testMatch: 1,
      testPathIgnorePatterns: 0,
      testRegex: 0,
    },
    tests: 1,
  },
  {
    config: {
      roots: ['/project'],
      testMatch: ['**/*.test.js', '!**/node_modules/**'],
      testPathIgnorePatterns: [],
      testRegex: [],
    },
    name: 'testMatch, negated glob',
    stats: {
      roots: 22,
      testMatch: 13,
      testPathIgnorePatterns: 0,
      testRegex: 0,
    },
    tests: 10,
  },
  {
    config: {
      roots: ['/project'],
      testMatch: ['!**/legacy/**'],
      testPathIgnorePatterns: [],
      testRegex: [],
    },
    name: 'testMatch, only negated globs',
    stats: {
      roots: 22,
      testMatch: 24,
      testPathIgnorePatterns: 0,
      testRegex: 0,
    },
    tests: 19,
  },
  {
    config: {
      roots: ['/project'],
      ...noRules,
      testPathIgnorePatterns: ['/node_modules/'],
    },
    name: 'testPathIgnorePatterns',
    stats: {
      roots: 22,
      testMatch: 0,
      testPathIgnorePatterns: 24,
      testRegex: 0,
    },
    tests: 19,
  },
  {
    config: {
      roots: ['/project'],
      ...noRules,
      testPathIgnorePatterns: ['/node_modules/', '/__mocks__/'],
    },
    name: 'several testPathIgnorePatterns',
    stats: {
      roots: 22,
      testMatch: 0,
      testPathIgnorePatterns: 23,
      testRegex: 0,
    },
    tests: 18,
  },
  {
    config: {
      roots: ['/project'],
      ...noRules,
      testPathIgnorePatterns: [
        String.raw`/node_modules/`,
        String.raw`\.skip\.js$`,
      ],
    },
    name: 'testPathIgnorePatterns with a regex',
    stats: {
      roots: 22,
      testMatch: 0,
      testPathIgnorePatterns: 23,
      testRegex: 0,
    },
    tests: 18,
  },
  {
    config: {
      roots: ['/project'],
      ...noRules,
      testRegex: [String.raw`(/__tests__/.*|(\.|/)(test|spec))\.jsx?$`],
    },
    name: 'testRegex',
    stats: {
      roots: 22,
      testMatch: 0,
      testPathIgnorePatterns: 0,
      testRegex: 19,
    },
    tests: 16,
  },
  {
    config: {
      roots: ['/project'],
      ...noRules,
      testRegex: ['/__tests__/', String.raw`\.spec\.ts$`],
    },
    name: 'testRegex with several patterns',
    stats: {
      roots: 22,
      testMatch: 0,
      testPathIgnorePatterns: 0,
      testRegex: 4,
    },
    tests: 4,
  },
  {
    config: {
      roots: ['/project'],
      ...noRules,
      testPathIgnorePatterns: ['/node_modules/'],
      testRegex: [String.raw`(/__tests__/.*|(\.|/)(test|spec))\.jsx?$`],
    },
    name: 'testRegex and testPathIgnorePatterns',
    stats: {
      roots: 22,
      testMatch: 0,
      testPathIgnorePatterns: 24,
      testRegex: 19,
    },
    tests: 13,
  },
  {
    config: {
      roots: ['/project'],
      testMatch: ['**/*.test.js'],
      testPathIgnorePatterns: ['/node_modules/'],
      testRegex: ['/src/'],
    },
    name: 'all four options',
    stats: {
      roots: 22,
      testMatch: 16,
      testPathIgnorePatterns: 24,
      testRegex: 11,
    },
    tests: 4,
  },
  {
    config: {
      roots: ['/project/packages/a', '/project/packages/b'],
      testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
      testPathIgnorePatterns: ['/__fixtures__/', '/node_modules/'],
      testRegex: ['/(src|lib)/'],
    },
    name: 'all four options with several roots',
    stats: {
      roots: 7,
      testMatch: 19,
      testPathIgnorePatterns: 23,
      testRegex: 12,
    },
    tests: 4,
  },
];

const createSearchSource = (
  config: MatchingConfig,
  allPaths: Array<string> = platformPaths,
) =>
  new SearchSource({
    config,
    hasteFS: {getAllFiles: () => allPaths},
  } as unknown as TestContext);

const noPatterns = {isSet: () => false} as TestPathPatternsExecutor;

describe.each(
  matrix.map(entry => ({...entry, config: toPlatformConfig(entry.config)})),
)('$name', ({config, stats, tests}) => {
  const searchSource = createSearchSource(config);

  it('agrees with getTestPathMatcher on every path', () => {
    const {isTestFilePath} = getTestPathMatcher(config);

    for (const path of platformPaths) {
      expect([path, searchSource.isTestFilePath(path)]).toEqual([
        path,
        isTestFilePath(path),
      ]);
    }
  });

  it('reports the same per-option counts as before the extraction', () => {
    const {
      stats: actualStats,
      tests: selected,
      total,
    } = searchSource.findMatchingTests(noPatterns);

    expect(actualStats).toEqual(stats);
    expect(selected).toHaveLength(tests);
    expect(total).toBe(platformPaths.length);
  });
});

describe.each(
  [
    {
      config: {
        roots: ['/project'],
        ...noRules,
        testRegex: [String.raw`(/__tests__/.*|(\.|/)(test|spec))\.jsx?$`],
      } as MatchingConfig,
      golden: [
        '/project/a.test.js',
        '/project/src/a.test.js',
        '/project/src/a.spec.js',
        '/project/__tests__/a.js',
        '/project/__tests__/nested/deep/a.jsx',
        '/project/node_modules/pkg/a.test.js',
        '/project/src/node_modules/a.test.js',
        '/project/__mocks__/a.test.js',
        '/project/legacy/a.test.js',
        '/project/packages/a/src/thing.test.js',
        '/project/packages/a/src/legacy/thing.test.js',
        '/project/packages/a/thing.test.js',
        '/project/packages/b/lib/thing.test.js',
        '/project/packages/b/node_modules/pkg/thing.test.js',
        '/project/packages/c/src/thing.test.js',
        '/project/packages/b/__fixtures__/thing.test.js',
      ],
      name: 'testRegex golden',
    },
    {
      config: {
        roots: ['/project/packages/a', '/project/packages/b'],
        testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
        testPathIgnorePatterns: ['/__fixtures__/', '/node_modules/'],
        testRegex: ['/(src|lib)/'],
      } as MatchingConfig,
      golden: [
        '/project/packages/a/src/thing.test.js',
        '/project/packages/a/src/legacy/thing.test.js',
        '/project/packages/b/src/thing.spec.ts',
        '/project/packages/b/lib/thing.test.js',
      ],
      name: 'all four options golden',
    },
  ].map(entry => ({
    ...entry,
    config: toPlatformConfig(entry.config),
    golden: entry.golden.map(toPlatformPath),
  })),
)('$name', ({config, golden}) => {
  const searchSource = createSearchSource(config);

  it('selects exactly the paths recorded before the extraction', () => {
    expect(
      platformPaths.filter(path => searchSource.isTestFilePath(path)),
    ).toEqual(golden);
    expect(
      searchSource.findMatchingTests(noPatterns).tests.map(({path}) => path),
    ).toEqual(golden);
  });
});

describe('with test path patterns', () => {
  it('adds a testPathPatterns stat and filters the tests', () => {
    const config: MatchingConfig = toPlatformConfig({
      roots: ['/project'],
      ...noRules,
    });
    const searchSource = createSearchSource(config);
    const isMatch = (path: string) => path.includes('packages');

    const {stats, tests, total} = searchSource.findMatchingTests({
      isMatch,
      isSet: () => true,
    } as TestPathPatternsExecutor);

    expect(stats).toEqual({
      roots: 22,
      testMatch: 0,
      testPathIgnorePatterns: 0,
      testPathPatterns: 8,
      testRegex: 0,
    });
    expect(tests.map(({path}) => path)).toEqual(
      platformPaths.filter(path => path.includes('packages')),
    );
    expect(total).toBe(platformPaths.length);
  });
});
