/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'os';
import * as path from 'path';
import micromatch = require('micromatch');
import type {Test} from '@jest/test-result';
import type {Config} from '@jest/types';
import type {ChangedFiles} from 'jest-changed-files';
import {replaceRootDirInPath} from 'jest-config';
import {escapePathForRegex} from 'jest-regex-util';
import {DependencyResolver} from 'jest-resolve-dependencies';
import type {Context} from 'jest-runtime';
import {buildSnapshotResolver} from 'jest-snapshot';
import {globsToMatcher, testPathPatternToRegExp} from 'jest-util';
import type {Filter, Stats, TestPathCases} from './types';

export type SearchResult = {
  noSCM?: boolean;
  stats?: Stats;
  collectCoverageFrom?: Set<string>;
  tests: Array<Test>;
  total?: number;
};

export type TestSelectionConfig = {
  input?: string;
  findRelatedTests?: boolean;
  onlyChanged?: boolean;
  paths?: Array<Config.Path>;
  shouldTreatInputAsPattern?: boolean;
  testPathPattern?: string;
  watch?: boolean;
};

const regexToMatcher = (testRegex: Config.ProjectConfig['testRegex']) => {
  const regexes = testRegex.map(testRegex => new RegExp(testRegex));

  return (path: Config.Path) =>
    regexes.some(regex => {
      const result = regex.test(path);

      // prevent stateful regexes from breaking, just in case
      regex.lastIndex = 0;

      return result;
    });
};

const toTests = (context: Context, tests: Array<Config.Path>) =>
  tests.map(path => ({
    context,
    duration: undefined,
    path,
  }));

const hasSCM = (changedFilesInfo: ChangedFiles) => {
  const {repos} = changedFilesInfo;
  // no SCM (git/hg/...) is found in any of the roots.
  const noSCM = Object.values(repos).every(scm => scm.size === 0);
  return !noSCM;
};

export default class SearchSource {
  private _context: Context;
  private _dependencyResolver: DependencyResolver | null;
  private _testPathCases: TestPathCases = [];

  constructor(context: Context) {
    const {config} = context;
    this._context = context;
    this._dependencyResolver = null;

    const rootPattern = new RegExp(
      config.roots.map(dir => escapePathForRegex(dir + path.sep)).join('|'),
    );
    this._testPathCases.push({
      isMatch: path => rootPattern.test(path),
      stat: 'roots',
    });

    if (config.testMatch.length) {
      this._testPathCases.push({
        isMatch: globsToMatcher(config.testMatch),
        stat: 'testMatch',
      });
    }

    if (config.testPathIgnorePatterns.length) {
      const testIgnorePatternsRegex = new RegExp(
        config.testPathIgnorePatterns.join('|'),
      );
      this._testPathCases.push({
        isMatch: path => !testIgnorePatternsRegex.test(path),
        stat: 'testPathIgnorePatterns',
      });
    }

    if (config.testRegex.length) {
      this._testPathCases.push({
        isMatch: regexToMatcher(config.testRegex),
        stat: 'testRegex',
      });
    }
  }

  private async _getOrBuildDependencyResolver(): Promise<DependencyResolver> {
    if (!this._dependencyResolver) {
      this._dependencyResolver = new DependencyResolver(
        this._context.resolver,
        this._context.hasteFS,
        await buildSnapshotResolver(this._context.config),
      );
    }
    return this._dependencyResolver;
  }

  private _filterTestPathsWithStats(
    allPaths: Array<Test>,
    testPathPattern?: string,
  ): SearchResult {
    const data: {
      stats: Stats;
      tests: Array<Test>;
      total: number;
    } = {
      stats: {
        roots: 0,
        testMatch: 0,
        testPathIgnorePatterns: 0,
        testRegex: 0,
      },
      tests: [],
      total: allPaths.length,
    };

    const testCases = Array.from(this._testPathCases); // clone
    if (testPathPattern) {
      const regex = testPathPatternToRegExp(testPathPattern);
      testCases.push({
        isMatch: (path: Config.Path) => regex.test(path),
        stat: 'testPathPattern',
      });
      data.stats.testPathPattern = 0;
    }

    data.tests = allPaths.filter(test => {
      let filterResult = true;
      for (const {isMatch, stat} of testCases) {
        if (isMatch(test.path)) {
          data.stats[stat]!++;
        } else {
          filterResult = false;
        }
      }
      return filterResult;
    });

    return data;
  }

  private _getAllTestPaths(testPathPattern?: string): SearchResult {
    return this._filterTestPathsWithStats(
      toTests(this._context, this._context.hasteFS.getAllFiles()),
      testPathPattern,
    );
  }

  isTestFilePath(path: Config.Path): boolean {
    return this._testPathCases.every(testCase => testCase.isMatch(path));
  }

  findMatchingTests(testPathPattern?: string): SearchResult {
    return this._getAllTestPaths(testPathPattern);
  }

  async findRelatedTests(
    allPaths: Set<Config.Path>,
    collectCoverage: boolean,
  ): Promise<SearchResult> {
    const dependencyResolver = await this._getOrBuildDependencyResolver();

    if (!collectCoverage) {
      return {
        tests: toTests(
          this._context,
          dependencyResolver.resolveInverse(
            allPaths,
            this.isTestFilePath.bind(this),
            {skipNodeResolution: this._context.config.skipNodeResolution},
          ),
        ),
      };
    }

    const testModulesMap = dependencyResolver.resolveInverseModuleMap(
      allPaths,
      this.isTestFilePath.bind(this),
      {skipNodeResolution: this._context.config.skipNodeResolution},
    );

    const allPathsAbsolute = Array.from(allPaths).map(p => path.resolve(p));

    const collectCoverageFrom = new Set<string>();

    testModulesMap.forEach(testModule => {
      if (!testModule.dependencies) {
        return;
      }

      testModule.dependencies.forEach(p => {
        if (!allPathsAbsolute.includes(p)) {
          return;
        }

        const filename = replaceRootDirInPath(this._context.config.rootDir, p);
        collectCoverageFrom.add(
          path.isAbsolute(filename)
            ? path.relative(this._context.config.rootDir, filename)
            : filename,
        );
      });
    });

    return {
      collectCoverageFrom,
      tests: toTests(
        this._context,
        testModulesMap.map(testModule => testModule.file),
      ),
    };
  }

  findTestsByPaths(paths: Array<Config.Path>): SearchResult {
    return {
      tests: toTests(
        this._context,
        paths
          .map(p => path.resolve(this._context.config.cwd, p))
          .filter(this.isTestFilePath.bind(this)),
      ),
    };
  }

  async findRelatedTestsFromPattern(
    paths: Array<Config.Path>,
    collectCoverage: boolean,
  ): Promise<SearchResult> {
    if (Array.isArray(paths) && paths.length) {
      const resolvedPaths = paths.map(p =>
        path.resolve(this._context.config.cwd, p),
      );
      return this.findRelatedTests(new Set(resolvedPaths), collectCoverage);
    }
    return {tests: []};
  }

  async findTestRelatedToChangedFiles(
    changedFilesInfo: ChangedFiles,
    collectCoverage: boolean,
  ): Promise<SearchResult> {
    if (!hasSCM(changedFilesInfo)) {
      return {noSCM: true, tests: []};
    }
    const {changedFiles} = changedFilesInfo;
    return this.findRelatedTests(changedFiles, collectCoverage);
  }

  private async _getTestPaths(
    globalConfig: Config.GlobalConfig,
    changedFiles?: ChangedFiles,
  ): Promise<SearchResult> {
    if (globalConfig.onlyChanged) {
      if (!changedFiles) {
        throw new Error('Changed files must be set when running with -o.');
      }

      return this.findTestRelatedToChangedFiles(
        changedFiles,
        globalConfig.collectCoverage,
      );
    }

    let paths = globalConfig.nonFlagArgs;

    if (globalConfig.findRelatedTests && 'win32' === os.platform()) {
      paths = this.filterPathsWin32(paths);
    }

    if (globalConfig.runTestsByPath && paths && paths.length) {
      return this.findTestsByPaths(paths);
    } else if (globalConfig.findRelatedTests && paths && paths.length) {
      return this.findRelatedTestsFromPattern(
        paths,
        globalConfig.collectCoverage,
      );
    } else if (globalConfig.testPathPattern != null) {
      return this.findMatchingTests(globalConfig.testPathPattern);
    } else {
      return {tests: []};
    }
  }

  public filterPathsWin32(paths: Array<string>): Array<string> {
    const allFiles = this._context.hasteFS.getAllFiles();
    const options = {nocase: true, windows: false};

    function normalizePosix(filePath: string) {
      return filePath.replace(/\\/g, '/');
    }

    paths = paths
      .map(p => {
        // micromatch works with forward slashes: https://github.com/micromatch/micromatch#backslashes
        const normalizedPath = normalizePosix(
          path.resolve(this._context.config.cwd, p),
        );
        const match = micromatch(
          allFiles.map(normalizePosix),
          normalizedPath,
          options,
        );
        return match[0];
      })
      .filter(Boolean)
      .map(p => path.resolve(p));
    return paths;
  }

  async getTestPaths(
    globalConfig: Config.GlobalConfig,
    changedFiles: ChangedFiles | undefined,
    filter?: Filter,
  ): Promise<SearchResult> {
    const searchResult = await this._getTestPaths(globalConfig, changedFiles);

    const filterPath = globalConfig.filter;

    if (filter) {
      const tests = searchResult.tests;

      const filterResult = await filter(tests.map(test => test.path));

      if (!Array.isArray(filterResult.filtered)) {
        throw new Error(
          `Filter ${filterPath} did not return a valid test list`,
        );
      }

      const filteredSet = new Set(
        filterResult.filtered.map(result => result.test),
      );

      return {
        ...searchResult,
        tests: tests.filter(test => filteredSet.has(test.path)),
      };
    }

    return searchResult;
  }

  async findRelatedSourcesFromTestsInChangedFiles(
    changedFilesInfo: ChangedFiles,
  ): Promise<Array<string>> {
    if (!hasSCM(changedFilesInfo)) {
      return [];
    }
    const {changedFiles} = changedFilesInfo;
    const dependencyResolver = await this._getOrBuildDependencyResolver();
    const relatedSourcesSet = new Set<string>();
    changedFiles.forEach(filePath => {
      if (this.isTestFilePath(filePath)) {
        const sourcePaths = dependencyResolver.resolve(filePath, {
          skipNodeResolution: this._context.config.skipNodeResolution,
        });
        sourcePaths.forEach(sourcePath => relatedSourcesSet.add(sourcePath));
      }
    });
    return Array.from(relatedSourcesSet);
  }
}
