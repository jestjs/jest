/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import type {Config} from '@jest/types';
import {replacePathSepForRegex} from 'jest-regex-util';
import {type TestPathCase, getTestPathMatcher} from '../getTestPathMatcher';
import normalize from '../normalize';

type TestPathMatcherConfig = Parameters<typeof getTestPathMatcher>[0];

const isWindows = process.platform === 'win32';

// The fixtures below are written with forward slashes so that the table stays
// readable. Jest's matching, however, sees the paths of the platform it runs
// on: `roots` and the paths themselves keep the native separator, while
// `jest-config` normalizes the patterns with `replacePathSepForRegex` and
// `replacePathSepForGlob` (see `normalize()`), so the fixtures are mapped onto
// the platform with the same rules here.
const toPlatformPath = (posixPath: string) =>
  isWindows ? `C:${posixPath.replaceAll('/', '\\')}` : posixPath;

// Globs are written and matched with forward slashes, only the root prefix is
// platform specific.
const toPlatformGlob = (posixGlob: string) =>
  isWindows && posixGlob.startsWith('/') ? `C:${posixGlob}` : posixGlob;
const toPlatformPattern = (pattern: string | RegExp): string => {
  if (typeof pattern !== 'string') {
    throw new TypeError('the fixtures below only use string patterns');
  }
  return replacePathSepForRegex(pattern);
};

const toPlatformConfig = ({
  roots,
  testMatch,
  testPathIgnorePatterns,
  testRegex,
}: TestPathMatcherConfig): TestPathMatcherConfig => ({
  roots: roots.map(toPlatformPath),
  testMatch: testMatch.map(toPlatformGlob),
  testPathIgnorePatterns: testPathIgnorePatterns.map(toPlatformPattern),
  testRegex: testRegex.map(toPlatformPattern),
});

/**
 * Every path used by the matrix below.
 *
 * The expectations are exhaustive: a config's `matches` lists all paths of this
 * list it accepts, and every path not listed must be rejected. The values were
 * recorded from Jest's own matching (the `SearchSource` implementation this
 * matcher was extracted from) so the table pins down the previous behaviour.
 */
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

type Expectation = {
  name: string;
  config: TestPathMatcherConfig;
  /** Paths of `paths` that must match. All other paths must not match. */
  matches: Array<string>;
  /** The `stat` of each case, in the order they are applied. */
  stats: Array<TestPathCase['stat']>;
};

const noRules = {
  testMatch: [],
  testPathIgnorePatterns: [],
  testRegex: [],
};

const expectations: Array<Expectation> = [
  {
    config: {roots: ['/project'], ...noRules},
    matches: [
      '/project/a.test.js',
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
    ],
    name: 'roots',
    stats: ['roots'],
  },
  {
    config: {roots: ['/project/packages/a', '/project/packages/b'], ...noRules},
    matches: [
      '/project/packages/a/src/thing.test.js',
      '/project/packages/a/src/legacy/thing.test.js',
      '/project/packages/a/thing.test.js',
      '/project/packages/b/src/thing.spec.ts',
      '/project/packages/b/lib/thing.test.js',
      '/project/packages/b/node_modules/pkg/thing.test.js',
      '/project/packages/b/__fixtures__/thing.test.js',
    ],
    name: 'multiple roots',
    stats: ['roots'],
  },
  {
    config: {roots: [], ...noRules},
    matches: [...paths],
    name: 'empty roots match everything',
    stats: ['roots'],
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
    matches: [
      '/project/a.test.js',
      '/project/src/a.test.js',
      '/project/src/a.spec.js',
      '/project/src/a.spec.ts',
      '/project/__tests__/a.js',
      '/project/__tests__/nested/deep/a.jsx',
      '/project/node_modules/pkg/a.test.js',
      '/project/src/node_modules/a.test.js',
      '/project/__mocks__/a.test.js',
      '/project/legacy/a.test.js',
      '/project/packages/a/src/thing.test.js',
      '/project/packages/a/src/legacy/thing.test.js',
      '/project/packages/a/thing.test.js',
      '/project/packages/b/src/thing.spec.ts',
      '/project/packages/b/lib/thing.test.js',
      '/project/packages/b/node_modules/pkg/thing.test.js',
      '/project/packages/c/src/thing.test.js',
      '/project/packages/b/__fixtures__/thing.test.js',
    ],
    name: 'testMatch (Jest defaults)',
    stats: ['roots', 'testMatch'],
  },
  {
    config: {
      roots: ['/project'],
      testMatch: ['/project/**/*.spec.js'],
      testPathIgnorePatterns: [],
      testRegex: [],
    },
    matches: ['/project/src/a.spec.js'],
    name: 'testMatch with an absolute glob',
    stats: ['roots', 'testMatch'],
  },
  {
    config: {
      roots: ['/project'],
      testMatch: ['**/*.test.js', '!**/node_modules/**'],
      testPathIgnorePatterns: [],
      testRegex: [],
    },
    matches: [
      '/project/a.test.js',
      '/project/src/a.test.js',
      '/project/__mocks__/a.test.js',
      '/project/legacy/a.test.js',
      '/project/packages/a/src/thing.test.js',
      '/project/packages/a/src/legacy/thing.test.js',
      '/project/packages/a/thing.test.js',
      '/project/packages/b/lib/thing.test.js',
      '/project/packages/c/src/thing.test.js',
      '/project/packages/b/__fixtures__/thing.test.js',
    ],
    name: 'testMatch with a negated glob',
    stats: ['roots', 'testMatch'],
  },
  {
    config: {
      roots: ['/project'],
      testMatch: ['!**/legacy/**'],
      testPathIgnorePatterns: [],
      testRegex: [],
    },
    matches: [
      '/project/a.test.js',
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
      '/project/src/a.skip.js',
      '/project/packages/a/src/thing.test.js',
      '/project/packages/a/thing.test.js',
      '/project/packages/b/src/thing.spec.ts',
      '/project/packages/b/lib/thing.test.js',
      '/project/packages/b/node_modules/pkg/thing.test.js',
      '/project/packages/c/src/thing.test.js',
      '/project/packages/b/__fixtures__/thing.test.js',
    ],
    name: 'testMatch with only negated globs',
    stats: ['roots', 'testMatch'],
  },
  {
    config: {
      roots: ['/project'],
      testMatch: [],
      testPathIgnorePatterns: ['/node_modules/'],
      testRegex: [],
    },
    matches: [
      '/project/a.test.js',
      '/project/',
      '/project/src/a.test.js',
      '/project/src/a.js',
      '/project/src/a.spec.js',
      '/project/src/a.spec.ts',
      '/project/__tests__/a.js',
      '/project/__tests__/nested/deep/a.jsx',
      '/project/__mocks__/a.test.js',
      '/project/legacy/a.test.js',
      '/project/legacy/a.js',
      '/project/src/a.skip.js',
      '/project/packages/a/src/thing.test.js',
      '/project/packages/a/src/legacy/thing.test.js',
      '/project/packages/a/thing.test.js',
      '/project/packages/b/src/thing.spec.ts',
      '/project/packages/b/lib/thing.test.js',
      '/project/packages/c/src/thing.test.js',
      '/project/packages/b/__fixtures__/thing.test.js',
    ],
    name: 'testPathIgnorePatterns',
    stats: ['roots', 'testPathIgnorePatterns'],
  },
  {
    config: {
      roots: ['/project'],
      testMatch: [],
      testPathIgnorePatterns: ['/node_modules/', '/__mocks__/'],
      testRegex: [],
    },
    matches: [
      '/project/a.test.js',
      '/project/',
      '/project/src/a.test.js',
      '/project/src/a.js',
      '/project/src/a.spec.js',
      '/project/src/a.spec.ts',
      '/project/__tests__/a.js',
      '/project/__tests__/nested/deep/a.jsx',
      '/project/legacy/a.test.js',
      '/project/legacy/a.js',
      '/project/src/a.skip.js',
      '/project/packages/a/src/thing.test.js',
      '/project/packages/a/src/legacy/thing.test.js',
      '/project/packages/a/thing.test.js',
      '/project/packages/b/src/thing.spec.ts',
      '/project/packages/b/lib/thing.test.js',
      '/project/packages/c/src/thing.test.js',
      '/project/packages/b/__fixtures__/thing.test.js',
    ],
    name: 'testPathIgnorePatterns with several patterns',
    stats: ['roots', 'testPathIgnorePatterns'],
  },
  {
    config: {
      roots: ['/project'],
      testMatch: [],
      testPathIgnorePatterns: [
        String.raw`/node_modules/`,
        String.raw`\.skip\.js$`,
      ],
      testRegex: [],
    },
    matches: [
      '/project/a.test.js',
      '/project/',
      '/project/src/a.test.js',
      '/project/src/a.js',
      '/project/src/a.spec.js',
      '/project/src/a.spec.ts',
      '/project/__tests__/a.js',
      '/project/__tests__/nested/deep/a.jsx',
      '/project/__mocks__/a.test.js',
      '/project/legacy/a.test.js',
      '/project/legacy/a.js',
      '/project/packages/a/src/thing.test.js',
      '/project/packages/a/src/legacy/thing.test.js',
      '/project/packages/a/thing.test.js',
      '/project/packages/b/src/thing.spec.ts',
      '/project/packages/b/lib/thing.test.js',
      '/project/packages/c/src/thing.test.js',
      '/project/packages/b/__fixtures__/thing.test.js',
    ],
    name: 'testPathIgnorePatterns are regular expressions',
    stats: ['roots', 'testPathIgnorePatterns'],
  },
  {
    config: {
      roots: ['/project'],
      testMatch: [],
      testPathIgnorePatterns: [],
      testRegex: [String.raw`(/__tests__/.*|(\.|/)(test|spec))\.jsx?$`],
    },
    matches: [
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
    name: 'testRegex',
    stats: ['roots', 'testRegex'],
  },
  {
    config: {
      roots: ['/project'],
      testMatch: [],
      testPathIgnorePatterns: [],
      testRegex: ['/__tests__/', String.raw`\.spec\.ts$`],
    },
    matches: [
      '/project/src/a.spec.ts',
      '/project/__tests__/a.js',
      '/project/__tests__/nested/deep/a.jsx',
      '/project/packages/b/src/thing.spec.ts',
    ],
    name: 'testRegex with several patterns',
    stats: ['roots', 'testRegex'],
  },
  {
    config: {
      roots: ['/project'],
      testMatch: [],
      testPathIgnorePatterns: ['/node_modules/'],
      testRegex: [String.raw`(/__tests__/.*|(\.|/)(test|spec))\.jsx?$`],
    },
    matches: [
      '/project/a.test.js',
      '/project/src/a.test.js',
      '/project/src/a.spec.js',
      '/project/__tests__/a.js',
      '/project/__tests__/nested/deep/a.jsx',
      '/project/__mocks__/a.test.js',
      '/project/legacy/a.test.js',
      '/project/packages/a/src/thing.test.js',
      '/project/packages/a/src/legacy/thing.test.js',
      '/project/packages/a/thing.test.js',
      '/project/packages/b/lib/thing.test.js',
      '/project/packages/c/src/thing.test.js',
      '/project/packages/b/__fixtures__/thing.test.js',
    ],
    name: 'testRegex combined with testPathIgnorePatterns',
    stats: ['roots', 'testPathIgnorePatterns', 'testRegex'],
  },
  {
    config: {
      roots: ['/project'],
      testMatch: ['**/*.test.js'],
      testPathIgnorePatterns: ['/node_modules/'],
      testRegex: ['/src/'],
    },
    matches: [
      '/project/src/a.test.js',
      '/project/packages/a/src/thing.test.js',
      '/project/packages/a/src/legacy/thing.test.js',
      '/project/packages/c/src/thing.test.js',
    ],
    name: 'all four options combined',
    stats: ['roots', 'testMatch', 'testPathIgnorePatterns', 'testRegex'],
  },
  {
    config: {
      roots: ['/project/packages/a', '/project/packages/b'],
      testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
      testPathIgnorePatterns: ['/__fixtures__/', '/node_modules/'],
      testRegex: ['/(src|lib)/'],
    },
    matches: [
      '/project/packages/a/src/thing.test.js',
      '/project/packages/a/src/legacy/thing.test.js',
      '/project/packages/b/src/thing.spec.ts',
      '/project/packages/b/lib/thing.test.js',
    ],
    name: 'all four options combined with several roots',
    stats: ['roots', 'testMatch', 'testPathIgnorePatterns', 'testRegex'],
  },
];

describe('getTestPathMatcher', () => {
  const platformPaths = paths.map(toPlatformPath);

  describe.each(
    expectations.map(expectation => ({
      ...expectation,
      config: toPlatformConfig(expectation.config),
      matches: expectation.matches.map(toPlatformPath),
    })),
  )('$name', ({config, matches, stats}) => {
    const matcher = getTestPathMatcher(config);

    it('only exposes the configured options as cases', () => {
      expect(matcher.cases.map(testCase => testCase.stat)).toEqual(stats);
    });

    it.each(platformPaths)('matches %s as expected', path => {
      expect(matcher.isTestFilePath(path)).toBe(matches.includes(path));
    });

    it('accepts exactly the expected paths', () => {
      expect(
        platformPaths.filter(path => matcher.isTestFilePath(path)),
      ).toEqual(matches);
    });
  });

  describe('with a config produced by normalize', () => {
    const rootDir = __dirname;

    // `testRegex` can be written as a string or as an array of strings, and
    // both end up as an array on the normalized config.
    it.each([
      [String.raw`\.spec\.ts$`, [String.raw`\.spec\.ts$`], false],
      [
        ['/__tests__/', String.raw`\.spec\.ts$`],
        ['/__tests__/', String.raw`\.spec\.ts$`],
        true,
      ],
    ] as Array<[string | Array<string>, Array<string>, boolean]>)(
      'normalizes testRegex %j to %j',
      async (testRegex, normalized, matchesTestFile) => {
        const {options: config} = await normalize(
          {rootDir, testRegex},
          {} as Config.Argv,
        );

        expect(config.testRegex).toEqual(
          normalized.map(replacePathSepForRegex),
        );

        const {isTestFilePath} = getTestPathMatcher(config);

        expect(isTestFilePath(path.join(rootDir, 'some/dir/a.spec.ts'))).toBe(
          true,
        );
        expect(isTestFilePath(path.join(rootDir, 'some/dir/a.test.ts'))).toBe(
          matchesTestFile,
        );
      },
    );

    it('resolves roots against rootDir', async () => {
      const packageRoot = path.resolve(rootDir, '..', '..');
      const {options: config} = await normalize(
        {rootDir: packageRoot, roots: ['<rootDir>']},
        {} as Config.Argv,
      );

      expect(config.roots).toEqual([packageRoot]);

      const {isTestFilePath} = getTestPathMatcher(config);

      expect(isTestFilePath(path.join(rootDir, 'some.test.ts'))).toBe(true);
      // Jest's default `testMatch` picks up any file inside a `__tests__`
      // directory, but only test files elsewhere.
      expect(isTestFilePath(path.join(rootDir, 'some.ts'))).toBe(true);
      expect(isTestFilePath(path.join(packageRoot, 'src/some.ts'))).toBe(false);
      expect(
        isTestFilePath(path.join(path.dirname(packageRoot), 'x.test.ts')),
      ).toBe(false);
    });
  });
});
