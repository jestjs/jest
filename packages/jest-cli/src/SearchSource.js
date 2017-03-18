/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Context} from 'types/Context';
import type {Glob, Path} from 'types/Config';
import type {ResolveModuleConfig} from 'types/Resolve';

const micromatch = require('micromatch');

const DependencyResolver = require('jest-resolve-dependencies');

const changedFiles = require('jest-changed-files');
const path = require('path');
const {
  escapePathForRegex,
  replacePathSepForRegex,
} = require('jest-regex-util');

type SearchSourceConfig = {
  roots: Array<Path>,
  testMatch: Array<Glob>,
  testRegex: string,
  testPathIgnorePatterns: Array<string>,
};

type SearchResult = {|
  noSCM?: boolean,
  paths: Array<Path>,
  stats?: {[key: string]: number},
  total?: number,
|};

type StrOrRegExpPattern = RegExp | string;

type Options = {|
  lastCommit?: boolean,
|};

export type PathPattern = {|
  input?: string,
  findRelatedTests?: boolean,
  lastCommit?: boolean,
  onlyChanged?: boolean,
  paths?: Array<Path>,
  shouldTreatInputAsPattern?: boolean,
  testPathPattern?: string,
  watch?: boolean,
|};

const git = changedFiles.git;
const hg = changedFiles.hg;

const determineSCM = path =>
  Promise.all([git.isGitRepository(path), hg.isHGRepository(path)]);
const pathToRegex = p => replacePathSepForRegex(p);

const globsToMatcher = (globs: ?Array<Glob>) => {
  if (globs == null || globs.length === 0) {
    return () => true;
  }

  const matchers = globs.map(each => micromatch.matcher(each, {dot: true}));
  return (path: Path) => matchers.some(each => each(path));
};

const regexToMatcher = (testRegex: string) => {
  if (!testRegex) {
    return () => true;
  }

  const regex = new RegExp(pathToRegex(testRegex));
  return (path: Path) => regex.test(path);
};

class SearchSource {
  _context: Context;
  _config: SearchSourceConfig;
  _options: ResolveModuleConfig;
  _rootPattern: RegExp;
  _testIgnorePattern: ?RegExp;
  _testPathCases: {
    roots: (path: Path) => boolean,
    testMatch: (path: Path) => boolean,
    testRegex: (path: Path) => boolean,
    testPathIgnorePatterns: (path: Path) => boolean,
  };

  constructor(
    context: Context,
    config: SearchSourceConfig,
    options?: ResolveModuleConfig,
  ) {
    this._context = context;
    this._config = config;
    this._options = options || {
      skipNodeResolution: false,
    };

    this._rootPattern = new RegExp(
      config.roots.map(dir => escapePathForRegex(dir)).join('|'),
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
    allPaths: Array<Path>,
    testPathPattern?: StrOrRegExpPattern,
  ): SearchResult {
    const data = {
      paths: [],
      stats: {},
      total: allPaths.length,
    };

    const testCases = Object.assign({}, this._testPathCases);
    if (testPathPattern) {
      const regex = new RegExp(testPathPattern, 'i');
      testCases.testPathPattern = path => regex.test(path);
    }

    const testCasesKeys = Object.keys(testCases);

    data.paths = allPaths.filter(path => {
      return testCasesKeys.reduce(
        (flag, key) => {
          if (testCases[key](path)) {
            data.stats[key] = ++data.stats[key] || 1;
            return flag && true;
          }
          data.stats[key] = data.stats[key] || 0;
          return false;
        },
        true,
      );
    });

    return data;
  }

  _getAllTestPaths(testPathPattern: StrOrRegExpPattern): SearchResult {
    return this._filterTestPathsWithStats(
      this._context.hasteFS.getAllFiles(),
      testPathPattern,
    );
  }

  isTestFilePath(path: Path): boolean {
    return Object.keys(this._testPathCases).every(key =>
      this._testPathCases[key](path));
  }

  findMatchingTests(testPathPattern: StrOrRegExpPattern): SearchResult {
    return this._getAllTestPaths(testPathPattern);
  }

  findRelatedTests(allPaths: Set<Path>): SearchResult {
    const dependencyResolver = new DependencyResolver(
      this._context.resolver,
      this._context.hasteFS,
    );
    return {
      paths: dependencyResolver.resolveInverse(
        allPaths,
        this.isTestFilePath.bind(this),
        {
          skipNodeResolution: this._options.skipNodeResolution,
        },
      ),
    };
  }

  findRelatedTestsFromPattern(paths: Array<Path>): SearchResult {
    if (Array.isArray(paths) && paths.length) {
      const resolvedPaths = paths.map(p => path.resolve(process.cwd(), p));
      return this.findRelatedTests(new Set(resolvedPaths));
    }
    return {paths: []};
  }

  findChangedTests(options: Options): Promise<SearchResult> {
    return Promise.all(this._config.roots.map(determineSCM)).then(repos => {
      if (!repos.every(([gitRepo, hgRepo]) => gitRepo || hgRepo)) {
        return {
          noSCM: true,
          paths: [],
        };
      }
      return Promise.all(
        Array.from(repos).map(([gitRepo, hgRepo]) => {
          return gitRepo
            ? git.findChangedFiles(gitRepo, options)
            : hg.findChangedFiles(hgRepo, options);
        }),
      ).then(changedPathSets =>
        this.findRelatedTests(
          new Set(Array.prototype.concat.apply([], changedPathSets)),
        ));
    });
  }

  getTestPaths(pattern: PathPattern): Promise<SearchResult> {
    if (pattern.onlyChanged) {
      return this.findChangedTests({lastCommit: pattern.lastCommit});
    } else if (pattern.findRelatedTests && pattern.paths) {
      return Promise.resolve(this.findRelatedTestsFromPattern(pattern.paths));
    } else if (pattern.testPathPattern != null) {
      return Promise.resolve(this.findMatchingTests(pattern.testPathPattern));
    } else {
      return Promise.resolve({paths: []});
    }
  }
}

module.exports = SearchSource;
