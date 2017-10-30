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
import fs from 'fs';
import micromatch from 'micromatch';
import DependencyResolver from 'jest-resolve-dependencies';
import testPathPatternToRegExp from './test_path_pattern_to_regexp';
import {escapePathForRegex, replacePathSepForRegex} from 'jest-regex-util';
import {
  extract as extractDocblock,
  parse as parseDocblock,
} from 'jest-docblock';

type SearchResult = {|
  noSCM?: boolean,
  stats?: {[key: string]: number},
  tests: Array<Test>,
  total?: number,
|};

type PathMatcher = (path: Path) => boolean;

type TestPathCases = {
  [string]: PathMatcher,
};

export type TestSelectionConfig = {|
  input?: string,
  findRelatedTests?: boolean,
  onlyChanged?: boolean,
  paths?: Array<Path>,
  shouldTreatInputAsPattern?: boolean,
  testPathPattern?: string,
  watch?: boolean,
|};

const pathToRegex = p => replacePathSepForRegex(p);

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

  const regex = new RegExp(pathToRegex(testRegex));
  return path => regex.test(path);
};

const tagsToMatcher = (testTags: ?Array<string>) => {
  if (!testTags) {
    return () => true;
  }

  const separator = /(,\s*)/;

  return path => {
    const code = fs.readFileSync(path, {encoding: 'utf-8'});
    const docblock = extractDocblock(code);
    const {tags: tagsInTestFile} = parseDocblock(docblock) || {};
    const tags = tagsInTestFile
      ? tagsInTestFile
          .split(separator)
          .map(tag => tag.trim())
          .filter(Boolean)
      : [];

    return tags.some(tag => testTags && testTags.indexOf(tag) >= 0);
  };
};

const negate = (fn: PathMatcher): PathMatcher => (path: Path) => !fn(path);

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
  _testPathCases: TestPathCases;

  constructor(context: Context) {
    const {config} = context;
    this._context = context;
    this._rootPattern = new RegExp(
      config.roots.map(dir => escapePathForRegex(dir)).join('|'),
    );

    const ignorePattern = config.testPathIgnorePatterns;
    this._testIgnorePattern = ignorePattern.length
      ? new RegExp(ignorePattern.join('|'))
      : null;

    const ignoreTags = config.testIgnoreTags;
    const testIgnoreTags =
      ignoreTags && ignoreTags.length > 0
        ? negate(tagsToMatcher(ignoreTags))
        : () => true;

    this._testPathCases = {
      roots: path => this._rootPattern.test(path),
      testIgnoreTags,
      testMatch: globsToMatcher(config.testMatch),
      testPathIgnorePatterns: path =>
        !this._testIgnorePattern || !this._testIgnorePattern.test(path),
      testRegex: regexToMatcher(config.testRegex),
      testTags: tagsToMatcher(config.testTags),
    };
  }

  _filterTestPathsWithStats(
    allPaths: Array<Test>,
    applyFilter: ?(testPathCases: TestPathCases) => TestPathCases,
  ): SearchResult {
    const data = {
      stats: {},
      tests: [],
      total: allPaths.length,
    };

    let testCases = Object.assign({}, this._testPathCases);
    if (applyFilter) {
      testCases = applyFilter(testCases);
    }

    const testCasesKeys = Object.keys(testCases);
    data.tests = allPaths.filter(test => {
      return testCasesKeys.reduce((flag, key) => {
        if (testCases[key](test.path)) {
          data.stats[key] = ++data.stats[key] || 1;
          return flag && true;
        }
        data.stats[key] = data.stats[key] || 0;
        return false;
      }, true);
    });

    return data;
  }

  _getAllTestPaths(testPathPattern: string): SearchResult {
    return this._filterTestPathsWithStats(
      toTests(this._context, this._context.hasteFS.getAllFiles()),
      testCases => {
        if (testPathPattern) {
          const regex = testPathPatternToRegExp(testPathPattern);
          testCases.testPathPattern = path => regex.test(path);
        }
        return testCases;
      },
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

  findTestsWithTags(tags: Array<string>): SearchResult {
    return this._filterTestPathsWithStats(
      toTests(this._context, this._context.hasteFS.getAllFiles()),
      testCases => {
        if (tags) {
          testCases.testForTags = tagsToMatcher(tags);
        }
        return testCases;
      },
    );
  }

  findRelatedTests(allPaths: Set<Path>): SearchResult {
    const dependencyResolver = new DependencyResolver(
      this._context.resolver,
      this._context.hasteFS,
    );
    return {
      tests: toTests(
        this._context,
        dependencyResolver.resolveInverse(
          allPaths,
          this.isTestFilePath.bind(this),
          {
            skipNodeResolution: this._context.config.skipNodeResolution,
          },
        ),
      ),
    };
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

  findRelatedTestsFromPattern(paths: Array<Path>): SearchResult {
    if (Array.isArray(paths) && paths.length) {
      const resolvedPaths = paths.map(p => path.resolve(process.cwd(), p));
      return this.findRelatedTests(new Set(resolvedPaths));
    }
    return {tests: []};
  }

  async findTestRelatedToChangedFiles(
    changedFilesPromise: ChangedFilesPromise,
  ) {
    const {repos, changedFiles} = await changedFilesPromise;

    // no SCM (git/hg/...) is found in any of the roots.
    const noSCM = Object.keys(repos).every(scm => repos[scm].size === 0);
    return noSCM
      ? {noSCM: true, tests: []}
      : this.findRelatedTests(changedFiles);
  }

  async getTestPaths(
    globalConfig: GlobalConfig,
    changedFilesPromise: ?ChangedFilesPromise,
  ): Promise<SearchResult> {
    const paths = globalConfig.nonFlagArgs;
    if (globalConfig.onlyChanged) {
      if (!changedFilesPromise) {
        throw new Error('This promise must be present when running with -o.');
      }

      return this.findTestRelatedToChangedFiles(changedFilesPromise);
    } else if (globalConfig.runTestsByPath && paths && paths.length) {
      return Promise.resolve(this.findTestsByPaths(paths));
    } else if (globalConfig.testTags != null) {
      return Promise.resolve(this.findTestsWithTags(globalConfig.testTags));
    } else if (globalConfig.findRelatedTests && paths && paths.length) {
      return Promise.resolve(this.findRelatedTestsFromPattern(paths));
    } else if (globalConfig.testPathPattern != null) {
      return Promise.resolve(
        this.findMatchingTests(globalConfig.testPathPattern),
      );
    } else {
      return Promise.resolve({tests: []});
    }
  }
}
