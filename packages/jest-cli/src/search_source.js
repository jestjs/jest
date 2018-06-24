/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Context} from 'types/Context';
import type {Glob, GlobalConfig, Path} from 'types/Config';
import type {Test} from 'types/TestRunner';
import type {ChangedFilesPromise} from 'types/ChangedFiles';

import path from 'path';
import micromatch from 'micromatch';
import DependencyResolver from 'jest-resolve-dependencies';
import testPathPatternToRegExp from './test_path_pattern_to_regexp';
import {escapePathForRegex} from 'jest-regex-util';
import {replaceRootDirInPath} from 'jest-config';

type SearchResult = {|
  noSCM?: boolean,
  stats?: {[key: string]: number},
  collectCoverageFrom?: Array<string>,
  tests: Array<Test>,
  total?: number,
|};

export type TestSelectionConfig = {|
  input?: string,
  findRelatedTests?: boolean,
  onlyChanged?: boolean,
  paths?: Array<Path>,
  shouldTreatInputAsPattern?: boolean,
  testPathPattern?: string,
  watch?: boolean,
|};

type FilterResult = {
  test: string,
  message: string,
};

const globsToMatcher = (globs: ?Array<Glob>) => {
  if (globs == null || globs.length === 0) {
    return () => true;
  }

  const matchers = globs.map(each => micromatch.matcher(each, {dot: true}));
  return path => matchers.some(each => each(path));
};

const regexToMatcher = (testRegex: string) => {
  if (!testRegex) {
    return () => true;
  }

  const regex = new RegExp(testRegex);
  return path => regex.test(path);
};

const toTests = (context, tests) =>
  tests.map(path => ({
    context,
    duration: undefined,
    path,
  }));

export default class SearchSource {
  _context: Context;
  _rootPattern: RegExp;
  _testIgnorePattern: ?RegExp;
  _testPathCases: {
    roots: (path: Path) => boolean,
    testMatch: (path: Path) => boolean,
    testRegex: (path: Path) => boolean,
    testPathIgnorePatterns: (path: Path) => boolean,
  };

  constructor(context: Context) {
    const {config} = context;
    this._context = context;
    this._rootPattern = new RegExp(
      config.roots.map(dir => escapePathForRegex(dir + path.sep)).join('|'),
    );

    const ignorePattern = config.testPathIgnorePatterns;
    this._testIgnorePattern = ignorePattern.length
      ? new RegExp(ignorePattern.join('|'))
      : null;

    this._testPathCases = {
      roots: path => this._rootPattern.test(path),
      testMatch: globsToMatcher(config.testMatch),
      testPathIgnorePatterns: path =>
        !this._testIgnorePattern || !this._testIgnorePattern.test(path),
      testRegex: regexToMatcher(config.testRegex),
    };
  }

  _filterTestPathsWithStats(
    allPaths: Array<Test>,
    testPathPattern?: string,
  ): SearchResult {
    const data = {
      stats: {},
      tests: [],
      total: allPaths.length,
    };

    const testCases = Object.assign({}, this._testPathCases);
    if (testPathPattern) {
      const regex = testPathPatternToRegExp(testPathPattern);
      testCases.testPathPattern = path => regex.test(path);
    }

    const testCasesKeys = Object.keys(testCases);
    data.tests = allPaths.filter(test =>
      testCasesKeys.reduce((flag, key) => {
        if (testCases[key](test.path)) {
          data.stats[key] = ++data.stats[key] || 1;
          return flag && true;
        }
        data.stats[key] = data.stats[key] || 0;
        return false;
      }, true),
    );

    return data;
  }

  _getAllTestPaths(testPathPattern: string): SearchResult {
    return this._filterTestPathsWithStats(
      toTests(this._context, this._context.hasteFS.getAllFiles()),
      testPathPattern,
    );
  }

  isTestFilePath(path: Path): boolean {
    return Object.keys(this._testPathCases).every(key =>
      this._testPathCases[key](path),
    );
  }

  findMatchingTests(testPathPattern: string): SearchResult {
    return this._getAllTestPaths(testPathPattern);
  }

  findRelatedTests(
    allPaths: Set<Path>,
    collectCoverage: boolean,
  ): SearchResult {
    const dependencyResolver = new DependencyResolver(
      this._context.resolver,
      this._context.hasteFS,
    );

    const tests = toTests(
      this._context,
      dependencyResolver.resolveInverse(
        allPaths,
        this.isTestFilePath.bind(this),
        {
          skipNodeResolution: this._context.config.skipNodeResolution,
        },
      ),
    );
    let collectCoverageFrom;

    // If we are collecting coverage, also return collectCoverageFrom patterns
    if (collectCoverage) {
      collectCoverageFrom = Array.from(allPaths).map(filename => {
        filename = replaceRootDirInPath(this._context.config.rootDir, filename);
        return path.isAbsolute(filename)
          ? path.relative(this._context.config.rootDir, filename)
          : filename;
      });
    }

    return {collectCoverageFrom, tests};
  }

  findTestsByPaths(paths: Array<Path>): SearchResult {
    return {
      tests: toTests(
        this._context,
        paths
          .map(p => path.resolve(process.cwd(), p))
          .filter(this.isTestFilePath.bind(this)),
      ),
    };
  }

  findRelatedTestsFromPattern(
    paths: Array<Path>,
    collectCoverage: boolean,
  ): SearchResult {
    if (Array.isArray(paths) && paths.length) {
      const resolvedPaths = paths.map(p => path.resolve(process.cwd(), p));
      return this.findRelatedTests(new Set(resolvedPaths), collectCoverage);
    }
    return {tests: []};
  }

  async findTestRelatedToChangedFiles(
    changedFilesPromise: ChangedFilesPromise,
    collectCoverage: boolean,
  ) {
    const {repos, changedFiles} = await changedFilesPromise;
    // no SCM (git/hg/...) is found in any of the roots.
    const noSCM = Object.keys(repos).every(scm => repos[scm].size === 0);
    return noSCM
      ? {noSCM: true, tests: []}
      : this.findRelatedTests(changedFiles, collectCoverage);
  }

  _getTestPaths(
    globalConfig: GlobalConfig,
    changedFilesPromise: ?ChangedFilesPromise,
  ): Promise<SearchResult> {
    const paths = globalConfig.nonFlagArgs;

    if (globalConfig.onlyChanged) {
      if (!changedFilesPromise) {
        throw new Error('This promise must be present when running with -o.');
      }

      return this.findTestRelatedToChangedFiles(
        changedFilesPromise,
        globalConfig.collectCoverage,
      );
    } else if (globalConfig.runTestsByPath && paths && paths.length) {
      return Promise.resolve(this.findTestsByPaths(paths));
    } else if (globalConfig.findRelatedTests && paths && paths.length) {
      return Promise.resolve(
        this.findRelatedTestsFromPattern(paths, globalConfig.collectCoverage),
      );
    } else if (globalConfig.testPathPattern != null) {
      return Promise.resolve(
        this.findMatchingTests(globalConfig.testPathPattern),
      );
    } else {
      return Promise.resolve({tests: []});
    }
  }

  async getTestPaths(
    globalConfig: GlobalConfig,
    changedFilesPromise: ?ChangedFilesPromise,
  ): Promise<SearchResult> {
    const searchResult = await this._getTestPaths(
      globalConfig,
      changedFilesPromise,
    );

    const filterPath = globalConfig.filter;

    if (filterPath && !globalConfig.skipFilter) {
      const tests = searchResult.tests;

      // $FlowFixMe: dynamic require.
      const filter: Array<FilterResult> = require(filterPath);
      const filterResult = await filter(tests.map(test => test.path));

      if (!Array.isArray(filterResult.filtered)) {
        throw new Error(
          `Filter ${filterPath} did not return a valid test list`,
        );
      }

      const filteredSet = new Set(
        filterResult.filtered.map(result => result.test),
      );

      // $FlowFixMe: Object.assign with empty object causes troubles to Flow.
      return Object.assign({}, searchResult, {
        tests: tests.filter(test => filteredSet.has(test.path)),
      });
    }

    return searchResult;
  }
}
