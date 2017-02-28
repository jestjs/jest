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

import type {Config} from 'types/Config';
import type {HasteContext} from 'types/HasteMap';
import type {Glob, Path} from 'types/Config';
import type {ResolveModuleConfig} from 'types/Resolve';

const micromatch = require('micromatch');

const DependencyResolver = require('jest-resolve-dependencies');

const chalk = require('chalk');
const changedFiles = require('jest-changed-files');
const path = require('path');
const {
  escapePathForRegex,
  replacePathSepForRegex,
} = require('jest-regex-util');

type SearchSourceConfig = {
  benchMatch: Array<Glob>,
  benchRegex: string,
  roots: Array<Path>,
  testMatch: Array<Glob>,
  testRegex: string,
  testPathIgnorePatterns: Array<string>,
};

type SearchResult = {|
  benchPaths?: Array<Path>,
  noSCM?: boolean,
  testPaths: Array<Path>,
  stats?: {[key: string]: number},
  total?: number,
|};

type StrOrRegExpPattern = RegExp | string;

type Options = {|
  lastCommit?: boolean,
|};

export type PatternInfo = {|
  benchPathPattern?: string,
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

const determineSCM = path => Promise.all([
  git.isGitRepository(path),
  hg.isHGRepository(path),
]);
const pathToRegex = p => replacePathSepForRegex(p);
const pluralize = (
  word: string,
  count: number,
  ending: string,
) => `${count} ${word}${count === 1 ? '' : ending}`;

const globsToMatcher = (globs: ?Array<Glob>) => {
  if (globs == null || globs.length === 0) {
    return () => true;
  }

  const matchers = globs.map(each => micromatch.matcher(each));
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
  _hasteContext: HasteContext;
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
  _benchPathCases: {
    benchMatch: (path: Path) => boolean,
    benchPathIgnorePatterns: (path: Path) => boolean,
    benchRegex: (path: Path) => boolean,
    roots: (path: Path) => boolean,
  };

  constructor(
    hasteMap: HasteContext,
    config: SearchSourceConfig,
    options?: ResolveModuleConfig,
  ) {
    this._hasteContext = hasteMap;
    this._config = config;
    this._options = options || {
      skipNodeResolution: false,
    };

    this._rootPattern =
      new RegExp(config.roots.map(
        dir => escapePathForRegex(dir),
      ).join('|'));

    const ignorePattern = config.testPathIgnorePatterns;
    this._testIgnorePattern =
      ignorePattern.length ? new RegExp(ignorePattern.join('|')) : null;

    this._testPathCases = {
      roots: path => this._rootPattern.test(path),
      testMatch: globsToMatcher(config.testMatch),
      testPathIgnorePatterns: path => (
        !this._testIgnorePattern ||
        !this._testIgnorePattern.test(path)
      ),
      testRegex: regexToMatcher(config.testRegex),
    };
    this._benchPathCases = {
      benchMatch: globsToMatcher(config.benchMatch),
      benchPathIgnorePatterns: path => (
        !this._testIgnorePattern ||
        !this._testIgnorePattern.test(path)
      ),
      benchRegex: regexToMatcher(config.benchRegex),
      roots: path => this._rootPattern.test(path),
    };
  }

  _filterTestAndBenchPathsWithStats(
    allPaths: Array<Path>,
    testPathPattern?: StrOrRegExpPattern,
    benchPathPattern?: StrOrRegExpPattern,
  ): SearchResult {
    const data = {
      benchPaths: [],
      stats: {},
      testPaths: [],
      total: allPaths.length,
    };

    const testCases = Object.assign({}, this._testPathCases);
    if (testPathPattern) {
      const regex = new RegExp(testPathPattern, 'i');
      testCases.testPathPattern = path => regex.test(path);
    }
    data.testPaths = this._getFilteredDataPathsAndApplyStats(
      data,
      testCases,
      allPaths,
    );

    const benchCases = Object.assign({}, this._benchPathCases);
    if (benchPathPattern) {
      const regex = new RegExp(benchPathPattern, 'i');
      benchCases.benchPathPattern = path => regex.test(path);
    }
    data.benchPaths = this._getFilteredDataPathsAndApplyStats(
      data,
      benchCases,
      allPaths,
    );

    return data;
  }

  _getFilteredDataPathsAndApplyStats(
    data: Object,
    cases: Object,
    allPaths: any
  ) {
    return allPaths.filter(path => {
      return Object.keys(cases).reduce((flag, key) => {
        if (cases[key](path)) {
          data.stats[key] = ++data.stats[key] || 1;
          return flag && true;
        }
        data.stats[key] = data.stats[key] || 0;
        return false;
      }, true);
    });
  }

  _getAllTestAndBenchmarkPaths(
    testPathPattern?: StrOrRegExpPattern,
    benchPathPattern?: StrOrRegExpPattern,
  ): SearchResult {
    return this._filterTestAndBenchPathsWithStats(
      this._hasteContext.hasteFS.getAllFiles(),
      testPathPattern,
      benchPathPattern,
    );
  }

  isTestFilePath(path: Path): boolean {
    return Object.keys(this._testPathCases).every(key => (
      this._testPathCases[key](path)
    ));
  }

  findMatchingTestsAndBenchmarks(
    testPathPattern?: StrOrRegExpPattern,
    benchPathPattern?: StrOrRegExpPattern,
  ): SearchResult {
    return this._getAllTestAndBenchmarkPaths(
      testPathPattern,
      benchPathPattern
    );
  }

  findRelatedTests(allPaths: Set<Path>): SearchResult {
    const dependencyResolver = new DependencyResolver(
      this._hasteContext.resolver,
      this._hasteContext.hasteFS,
    );
    return {
      testPaths: dependencyResolver.resolveInverse(
        allPaths,
        this.isTestFilePath.bind(this),
        {
          skipNodeResolution: this._options.skipNodeResolution,
        },
      ),
    };
  }

  findRelatedTestsFromPattern(
    paths: Array<Path>,
  ): SearchResult {
    if (Array.isArray(paths) && paths.length) {
      const resolvedPaths = paths.map(p => path.resolve(process.cwd(), p));
      return this.findRelatedTests(new Set(resolvedPaths));
    }
    return {
      benchPaths: [],
      testPaths: [],
    };
  }

  findChangedTests(options: Options): Promise<SearchResult> {
    return Promise.all(this._config.roots.map(determineSCM))
      .then(repos => {
        if (!repos.every(([gitRepo, hgRepo]) => gitRepo || hgRepo)) {
          return {
            benchPaths: [],
            noSCM: true,
            testPaths: [],
          };
        }
        return Promise.all(Array.from(repos).map(([gitRepo, hgRepo]) => {
          return gitRepo
            ? git.findChangedFiles(gitRepo, options)
            : hg.findChangedFiles(hgRepo, options);
        })).then(changedPathSets => this.findRelatedTests(
          new Set(Array.prototype.concat.apply([], changedPathSets)),
        ));
      });
  }

  getNoTestsOrBenchmarksFoundMessage(
    patternInfo: PatternInfo,
    config: Config,
    data: SearchResult,
    noTestsFound: boolean,
    noBenchesFound: boolean,
  ): string {
    if (patternInfo.onlyChanged) {
      return (
        chalk.bold(
          'No tests found related to files changed since last commit.\n',
        ) +
        chalk.dim(
          patternInfo.watch ?
            'Press `a` to run all tests, or run Jest with `--watchAll`.' :
            'Run Jest without `-o` to run all tests.',
        )
      );
    }

    const testPathPattern = SearchSource.getTestPathPattern(patternInfo);
    const stats = data.stats || {};
    const statsMessage = Object.keys(stats).map(key => {
      const value = key === 'testPathPattern' ? testPathPattern : config[key];
      if (value) {
        const matches = pluralize('match', stats[key], 'es');
        return `  ${key}: ${chalk.yellow(value)} - ${matches}`;
      }
      return null;
    }).filter(line => line).join('\n');

    return (
      (noTestsFound 
        ? chalk.bold('No tests found') + '\n'
        : ''
      ) +
      (noBenchesFound 
        ? chalk.bold('No benches found') + '\n'
        : ''
      ) +
      (data.total
        ? `  ${pluralize('file', data.total || 0, 's')} checked.\n` +
          statsMessage
        : `No files found in ${config.rootDir}.\n` +
          `Make sure Jest's configuration does not exclude this directory.\n` +
          `To set up Jest, make sure a package.json file exists.\n` +
          `Jest Documentation: facebook.github.io/jest/docs/configuration.html`
      )
    );
  }

  getTestAndBenchmarkPaths(patternInfo: PatternInfo): Promise<SearchResult> {
    if (patternInfo.onlyChanged) {
      return this.findChangedTests({lastCommit: patternInfo.lastCommit});
    } else if (patternInfo.findRelatedTests && patternInfo.paths) {
      return Promise.resolve(
        this.findRelatedTestsFromPattern(patternInfo.paths),
      );
    } else {
      return Promise.resolve(
        this.findMatchingTestsAndBenchmarks(
          patternInfo.testPathPattern,
          patternInfo.benchPathPattern,
        )
      );
    }
  }

  static getTestPathPattern(patternInfo: PatternInfo): string {
    const pattern = patternInfo.testPathPattern;
    const input = patternInfo.input;
    const formattedPattern = `/${pattern || ''}/`;
    const formattedInput = patternInfo.shouldTreatInputAsPattern
      ? `/${input || ''}/`
      : `"${input || ''}"`;
    return (input === pattern) ? formattedInput : formattedPattern;
  }

}

module.exports = SearchSource;
