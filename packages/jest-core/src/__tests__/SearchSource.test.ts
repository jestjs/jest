/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as path from 'path';
import {TestPathPatterns} from '@jest/pattern';
import type {Test} from '@jest/test-result';
import type {Config} from '@jest/types';
import {normalize} from 'jest-config';
import Runtime from 'jest-runtime';
import SearchSource from '../SearchSource';
import type {Filter} from '../types';

jest.setTimeout(15_000);

jest.mock('graceful-fs', () => {
  const realFs = jest.requireActual<typeof import('fs')>('fs');

  const mockedFs: typeof import('fs') = {
    ...realFs,
    statSync: path => {
      if (path === '/foo/bar/prefix') {
        return {isDirectory: () => true};
      }

      return realFs.statSync(path);
    },
  };

  return mockedFs;
});

const rootDir = path.resolve(__dirname, 'test_root');
const testRegex = `${path.sep}__testtests__${path.sep}`;
const testMatch = ['**/__testtests__/**/*'];
const maxWorkers = 1;

const toPaths = (tests: Array<Test>) => tests.map(({path}) => path);

const initSearchSource = async (
  initialOptions: Config.InitialOptions,
  options: {
    contextFiles?: Array<string>;
  } = {},
) => {
  const {options: config} = await normalize(initialOptions, {} as Config.Argv);
  const context = await Runtime.createContext(config, {
    maxWorkers,
    watchman: false,
  });
  if (options.contextFiles) {
    jest
      .spyOn(context.hasteFS, 'getAllFiles')
      .mockReturnValue(options.contextFiles);
  }
  return {config, searchSource: new SearchSource(context)};
};

describe('SearchSource', () => {
  const id = 'SearchSource';
  let searchSource: SearchSource;

  describe('isTestFilePath', () => {
    beforeEach(async () => {
      ({searchSource} = await initSearchSource({
        id,
        rootDir: '.',
        roots: [],
      }));
    });

    // micromatch doesn't support '..' through the globstar ('**') to avoid
    // infinite recursion.
    it('supports ../ paths and unix separators via testRegex', async () => {
      if (process.platform === 'win32') {
        return;
      }
      const {searchSource} = await initSearchSource({
        id,
        rootDir: '.',
        roots: [],
        testMatch: undefined,
        testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.jsx?$',
      });

      const path = '/path/to/__tests__/foo/bar/baz/../../../test.js';
      expect(searchSource.isTestFilePath(path)).toBe(true);
    });

    it('supports unix separators', () => {
      if (process.platform !== 'win32') {
        const path = '/path/to/__tests__/test.js';
        expect(searchSource.isTestFilePath(path)).toBe(true);
      }
    });

    it('supports win32 separators', () => {
      if (process.platform === 'win32') {
        const path = '\\path\\to\\__tests__\\test.js';
        expect(searchSource.isTestFilePath(path)).toBe(true);
      }
    });
  });

  describe('getTestPaths', () => {
    const getTestPaths = async (
      initialOptions: Config.InitialOptions,
      filter?: Filter,
    ) => {
      const {searchSource, config} = await initSearchSource(initialOptions);
      const allConfig = {
        ...config,
        ...initialOptions,
        testPathPatterns: new TestPathPatterns([]),
      };
      const {tests: paths} = await searchSource.getTestPaths(
        allConfig,
        allConfig,
        null,
        filter,
      );
      return paths.map(({path: p}) => path.relative(rootDir, p)).sort();
    };

    it('finds tests matching a pattern via testRegex', async () => {
      const paths = await getTestPaths({
        id,
        moduleFileExtensions: ['js', 'jsx', 'txt'],
        rootDir,
        testMatch: undefined,
        testRegex: 'not-really-a-test',
      });
      expect(paths).toEqual([
        path.normalize('.hiddenFolder/not-really-a-test.txt'),
        path.normalize('__testtests__/not-really-a-test.txt'),
      ]);
    });

    it('finds tests matching a pattern via testMatch', async () => {
      const paths = await getTestPaths({
        id,
        moduleFileExtensions: ['js', 'jsx', 'txt'],
        rootDir,
        testMatch: ['**/not-really-a-test.txt', '!**/do-not-match-me.txt'],
        testRegex: '',
      });
      expect(paths).toEqual([
        path.normalize('.hiddenFolder/not-really-a-test.txt'),
        path.normalize('__testtests__/not-really-a-test.txt'),
      ]);
    });

    it('finds tests matching a JS regex pattern', async () => {
      const paths = await getTestPaths({
        id,
        moduleFileExtensions: ['js', 'jsx'],
        rootDir,
        testMatch: undefined,
        testRegex: 'test.jsx?',
      });
      expect(paths).toEqual([
        path.normalize('__testtests__/test.js'),
        path.normalize('__testtests__/test.jsx'),
      ]);
    });

    it('finds tests matching a JS glob pattern', async () => {
      const paths = await getTestPaths({
        id,
        moduleFileExtensions: ['js', 'jsx'],
        rootDir,
        testMatch: ['**/test.js?(x)'],
        testRegex: '',
      });
      expect(paths).toEqual([
        path.normalize('__testtests__/test.js'),
        path.normalize('__testtests__/test.jsx'),
      ]);
    });

    it('finds tests matching a JS with overriding glob patterns', async () => {
      const paths = await getTestPaths({
        id,
        moduleFileExtensions: ['js', 'jsx'],
        rootDir,
        testMatch: [
          '**/*.js?(x)',
          '!**/test.js?(x)',
          '**/test.js',
          '!**/test.js',
        ],
        testRegex: '',
      });
      expect(paths).toEqual([
        path.normalize('module.jsx'),
        path.normalize('noTests.js'),
      ]);
    });

    it('finds tests with default file extensions using testRegex', async () => {
      const paths = await getTestPaths({
        id,
        rootDir,
        testMatch: undefined,
        testRegex,
      });
      expect(paths).toEqual([
        path.normalize('__testtests__/test.js'),
        path.normalize('__testtests__/test.jsx'),
      ]);
    });

    it('finds tests with default file extensions using testMatch', async () => {
      const paths = await getTestPaths({
        id,
        rootDir,
        testMatch,
        testRegex: '',
      });
      expect(paths).toEqual([
        path.normalize('__testtests__/test.js'),
        path.normalize('__testtests__/test.jsx'),
      ]);
    });

    it('finds tests with parentheses in their rootDir when using testMatch', async () => {
      const paths = await getTestPaths({
        id,
        rootDir: path.resolve(__dirname, 'test_root_with_(parentheses)'),
        testMatch: ['<rootDir>**/__testtests__/**/*'],
        testRegex: undefined,
      });
      expect(paths).toEqual([
        expect.stringContaining(path.normalize('__testtests__/test.js')),
      ]);
    });

    it('finds tests with similar but custom file extensions', async () => {
      const paths = await getTestPaths({
        id,
        moduleFileExtensions: ['js', 'jsx'],
        rootDir,
        testMatch,
      });
      expect(paths).toEqual([
        path.normalize('__testtests__/test.js'),
        path.normalize('__testtests__/test.jsx'),
      ]);
    });

    it('finds tests with totally custom foobar file extensions', async () => {
      const paths = await getTestPaths({
        id,
        moduleFileExtensions: ['js', 'foobar'],
        rootDir,
        testMatch,
      });
      expect(paths).toEqual([
        path.normalize('__testtests__/test.foobar'),
        path.normalize('__testtests__/test.js'),
      ]);
    });

    it('finds tests with many kinds of file extensions', async () => {
      const paths = await getTestPaths({
        id,
        moduleFileExtensions: ['js', 'jsx'],
        rootDir,
        testMatch,
      });
      expect(paths).toEqual([
        path.normalize('__testtests__/test.js'),
        path.normalize('__testtests__/test.jsx'),
      ]);
    });

    it('finds tests using a regex only', async () => {
      const paths = await getTestPaths({
        id,
        rootDir,
        testMatch: undefined,
        testRegex,
      });
      expect(paths).toEqual([
        path.normalize('__testtests__/test.js'),
        path.normalize('__testtests__/test.jsx'),
      ]);
    });

    it('finds tests using a glob only', async () => {
      const paths = await getTestPaths({
        id,
        rootDir,
        testMatch,
        testRegex: '',
      });
      expect(paths).toEqual([
        path.normalize('__testtests__/test.js'),
        path.normalize('__testtests__/test.jsx'),
      ]);
    });

    it('filter tests based on an optional filter method', async () => {
      const filterFunction = (testPaths: Array<string>) =>
        Promise.resolve({
          filtered: testPaths.filter(testPath => testPath.includes('test.jsx')),
        });
      const paths = await getTestPaths(
        {
          id,
          rootDir,
        },
        filterFunction,
      );

      expect(paths).toHaveLength(1);
      expect(paths[0]).toStrictEqual(path.normalize('__testtests__/test.jsx'));
    });
  });

  describe('filterPathsWin32', () => {
    beforeEach(async () => {
      ({searchSource} = await initSearchSource(
        {
          id,
          rootDir: '.',
          roots: [],
        },
        {
          contextFiles: [
            path.resolve('packages/lib/my-lib.ts'),
            path.resolve('packages/@core/my-app.ts'),
            path.resolve('packages/+cli/my-cli.ts'),
            path.resolve('packages/.hidden/my-app-hidden.ts'),
            path.resolve('packages/programs (x86)/my-program.ts'),
          ],
        },
      ));
    });

    it('should allow a simple match', async () => {
      const result = searchSource.filterPathsWin32(['packages/lib/my-lib.ts']);
      expect(result).toEqual([path.resolve('packages/lib/my-lib.ts')]);
    });
    it('should allow to match a file inside a hidden directory', async () => {
      const result = searchSource.filterPathsWin32([
        'packages/.hidden/my-app-hidden.ts',
      ]);
      expect(result).toEqual([
        path.resolve('packages/.hidden/my-app-hidden.ts'),
      ]);
    });
    it('should allow to match a file inside a directory prefixed with a "@"', async () => {
      const result = searchSource.filterPathsWin32([
        'packages/@core/my-app.ts',
      ]);
      expect(result).toEqual([path.resolve('packages/@core/my-app.ts')]);
    });
    it('should allow to match a file inside a directory prefixed with a "+"', async () => {
      const result = searchSource.filterPathsWin32(['packages/+cli/my-cli.ts']);
      expect(result).toEqual([path.resolve('packages/+cli/my-cli.ts')]);
    });
    it('should allow an @(pattern)', () => {
      const result = searchSource.filterPathsWin32([
        'packages/@(@core)/my-app.ts',
      ]);
      expect(result).toEqual([path.resolve('packages/@core/my-app.ts')]);
    });
    it('should allow a +(pattern)', () => {
      const result = searchSource.filterPathsWin32([
        'packages/+(@core)/my-app.ts',
      ]);
      expect(result).toEqual([path.resolve('packages/@core/my-app.ts')]);
    });
    it('should allow for (pattern) in file path', () => {
      const result = searchSource.filterPathsWin32([
        'packages/programs (x86)/my-program.ts',
      ]);
      expect(result).toEqual([
        path.resolve('packages/programs (x86)/my-program.ts'),
      ]);
    });
    it('should allow no results found', () => {
      const result = searchSource.filterPathsWin32(['not/exists']);
      expect(result).toHaveLength(0);
    });
  });

  describe('findRelatedTests', () => {
    const rootDir = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'jest-runtime',
      'src',
      '__tests__',
      'test_root',
    );
    const rootPath = path.join(rootDir, 'root.js');

    beforeEach(async () => {
      ({searchSource} = await initSearchSource({
        haste: {
          hasteImplModulePath: path.join(
            __dirname,
            '..',
            '..',
            '..',
            'jest-haste-map',
            'src',
            '__tests__',
            'haste_impl.js',
          ),
        },
        id: 'SearchSource-findRelatedTests-tests',
        rootDir,
      }));
    });

    it('makes sure a file is related to itself', async () => {
      const data = await searchSource.findRelatedTests(
        new Set([rootPath]),
        false,
      );
      expect(toPaths(data.tests)).toEqual([rootPath]);
    });

    it('finds tests that depend directly on the path', async () => {
      const filePath = path.join(rootDir, 'RegularModule.js');
      const file2Path = path.join(rootDir, 'RequireRegularModule.js');
      const parentDep = path.join(rootDir, 'ModuleWithSideEffects.js');
      const data = await searchSource.findRelatedTests(
        new Set([filePath]),
        false,
      );
      expect(toPaths(data.tests).sort()).toEqual([
        parentDep,
        filePath,
        file2Path,
        rootPath,
      ]);
    });

    it('excludes untested files from coverage', async () => {
      const unrelatedFile = path.join(rootDir, 'JSONFile.json');
      const regular = path.join(rootDir, 'RegularModule.js');
      const requireRegular = path.join(rootDir, 'RequireRegularMode.js');

      const data = await searchSource.findRelatedTests(
        new Set([regular, requireRegular, unrelatedFile]),
        true,
      );
      expect([...(data.collectCoverageFrom || [])]).toEqual([
        'RegularModule.js',
      ]);
    });
  });

  describe('findRelatedTestsFromPattern', () => {
    beforeEach(async () => {
      ({searchSource} = await initSearchSource({
        id,
        moduleFileExtensions: ['js', 'jsx', 'foobar'],
        rootDir,
        testMatch,
      }));
    });

    it('returns empty search result for empty input', async () => {
      const input: Array<string> = [];
      const data = await searchSource.findRelatedTestsFromPattern(input, false);
      expect(data.tests).toEqual([]);
    });

    it('returns empty search result for invalid input', async () => {
      const input = ['non-existend.js'];
      const data = await searchSource.findRelatedTestsFromPattern(input, false);
      expect(data.tests).toEqual([]);
    });

    it('returns empty search result if no related tests were found', async () => {
      const input = ['no_tests.js'];
      const data = await searchSource.findRelatedTestsFromPattern(input, false);
      expect(data.tests).toEqual([]);
    });

    it('finds tests for a single file', async () => {
      const input = ['packages/jest-core/src/__tests__/test_root/module.jsx'];
      const data = await searchSource.findRelatedTestsFromPattern(input, false);
      expect(toPaths(data.tests).sort()).toEqual([
        path.join(rootDir, '__testtests__', 'test.js'),
        path.join(rootDir, '__testtests__', 'test.jsx'),
      ]);
    });

    it('finds tests for multiple files', async () => {
      const input = [
        'packages/jest-core/src/__tests__/test_root/module.jsx',
        'packages/jest-core/src/__tests__/test_root/module.foobar',
      ];
      const data = await searchSource.findRelatedTestsFromPattern(input, false);
      expect(toPaths(data.tests).sort()).toEqual([
        path.join(rootDir, '__testtests__', 'test.foobar'),
        path.join(rootDir, '__testtests__', 'test.js'),
        path.join(rootDir, '__testtests__', 'test.jsx'),
      ]);
    });

    it('does not mistake roots folders with prefix names', async () => {
      if (process.platform === 'win32') {
        return;
      }
      ({searchSource} = await initSearchSource({
        id,
        rootDir: '.',
        roots: ['/foo/bar/prefix'],
      }));

      const input = ['/foo/bar/prefix-suffix/__tests__/my-test.test.js'];
      const data = searchSource.findTestsByPaths(input);
      expect(data.tests).toEqual([]);
    });
  });

  describe('findRelatedSourcesFromTestsInChangedFiles', () => {
    const rootDir = path.resolve(
      __dirname,
      '../../../jest-runtime/src/__tests__/test_root',
    );

    beforeEach(async () => {
      ({searchSource} = await initSearchSource({
        haste: {
          hasteImplModulePath: path.resolve(
            __dirname,
            '../../../jest-haste-map/src/__tests__/haste_impl.js',
          ),
        },
        id: 'SearchSource-findRelatedSourcesFromTestsInChangedFiles-tests',
        rootDir,
      }));
    });

    it('return empty set if no SCM', async () => {
      const requireRegularModule = path.join(
        rootDir,
        'RequireRegularModule.js',
      );
      const sources =
        await searchSource.findRelatedSourcesFromTestsInChangedFiles({
          changedFiles: new Set([requireRegularModule]),
          repos: {
            git: new Set(),
            hg: new Set(),
          },
        });
      expect(sources).toEqual([]);
    });

    it('return sources required by tests', async () => {
      const regularModule = path.join(rootDir, 'RegularModule.js');
      const requireRegularModule = path.join(
        rootDir,
        'RequireRegularModule.js',
      );
      const sources =
        await searchSource.findRelatedSourcesFromTestsInChangedFiles({
          changedFiles: new Set([requireRegularModule]),
          repos: {
            git: new Set('/path/to/git'),
            hg: new Set(),
          },
        });
      expect(sources).toEqual([regularModule]);
    });
  });
});
