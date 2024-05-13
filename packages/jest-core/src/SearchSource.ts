/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'os';
import * as path from 'path';
import micromatch = require('micromatch');
import type {TestPathPatternsExecutor} from '@jest/pattern';
import type {Test, TestContext} from '@jest/test-result';
import type {Config} from '@jest/types';
import type {ChangedFiles} from 'jest-changed-files';
import {replaceRootDirInPath} from 'jest-config';
import {escapePathForRegex} from 'jest-regex-util';
import {DependencyResolver} from 'jest-resolve-dependencies';
import {buildSnapshotResolver} from 'jest-snapshot';
import {globsToMatcher} from 'jest-util';
import type {Filter, Stats, TestPathCases} from './types';

export type SearchResult = {
  noSCM?: boolean;
  stats?: Stats;
  collectCoverageFrom?: Set<string>;
  tests: Array<Test>;
  total?: number;
};

const regexToMatcher = (testRegex: Config.ProjectConfig['testRegex']) => {
  const regexes = testRegex.map(testRegex => new RegExp(testRegex));

  return (path: string) =>
    regexes.some(regex => {
      const result = regex.test(path);

      // prevent stateful regexes from breaking, just in case
      regex.lastIndex = 0;

      return result;
    });
};

const toTests = (context: TestContext, tests: Array<string>) =>
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

function normalizePosix(filePath: string) {
  return filePath.replaceAll('\\', '/');
}

export default class SearchSource {
  private readonly _context: TestContext;
  private _dependencyResolver: DependencyResolver | null;
  private readonly _testPathCases: TestPathCases = [];

  constructor(context: TestContext) {
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

    if (config.testMatch.length > 0) {
      this._testPathCases.push({
        isMatch: globsToMatcher(config.testMatch),
        stat: 'testMatch',
      });
    }

    if (config.testPathIgnorePatterns.length > 0) {
      const testIgnorePatternsRegex = new RegExp(
        config.testPathIgnorePatterns.join('|'),
      );
      this._testPathCases.push({
        isMatch: path => !testIgnorePatternsRegex.test(path),
        stat: 'testPathIgnorePatterns',
      });
    }

    if (config.testRegex.length > 0) {
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
    testPathPatternsExecutor: TestPathPatternsExecutor,
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

    const testCases = [...this._testPathCases]; // clone
    if (testPathPatternsExecutor.isSet()) {
      testCases.push({
        isMatch: (path: string) => testPathPatternsExecutor.isMatch(path),
        stat: 'testPathPatterns',
      });
      data.stats.testPathPatterns = 0;
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

  private _getAllTestPaths(
    testPathPatternsExecutor: TestPathPatternsExecutor,
  ): SearchResult {
    return this._filterTestPathsWithStats(
      toTests(this._context, this._context.hasteFS.getAllFiles()),
      testPathPatternsExecutor,
    );
  }

  isTestFilePath(path: string): boolean {
    return this._testPathCases.every(testCase => testCase.isMatch(path));
  }

  findMatchingTests(
    testPathPatternsExecutor: TestPathPatternsExecutor,
  ): SearchResult {
    return this._getAllTestPaths(testPathPatternsExecutor);
  }

  async findRelatedTests(
    allPaths: Set<string>,
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

    const allPathsAbsolute = new Set([...allPaths].map(p => path.resolve(p)));

    const collectCoverageFrom = new Set<string>();

    for (const testModule of testModulesMap) {
      if (!testModule.dependencies) {
        continue;
      }

      for (const p of testModule.dependencies) {
        if (!allPathsAbsolute.has(p)) {
          continue;
        }

        const filename = replaceRootDirInPath(this._context.config.rootDir, p);
        collectCoverageFrom.add(
          path.isAbsolute(filename)
            ? path.relative(this._context.config.rootDir, filename)
            : filename,
        );
      }
    }

    return {
      collectCoverageFrom,
      tests: toTests(
        this._context,
        testModulesMap.map(testModule => testModule.file),
      ),
    };
  }

  findTestsByPaths(paths: Array<string>): SearchResult {
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
    paths: Array<string>,
    collectCoverage: boolean,
  ): Promise<SearchResult> {
    if (Array.isArray(paths) && paths.length > 0) {
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
    projectConfig: Config.ProjectConfig,
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

    if (globalConfig.runTestsByPath && paths && paths.length > 0) {
      return this.findTestsByPaths(paths);
    } else if (globalConfig.findRelatedTests && paths && paths.length > 0) {
      return this.findRelatedTestsFromPattern(
        paths,
        globalConfig.collectCoverage,
      );
    } else {
      return this.findMatchingTests(
        globalConfig.testPathPatterns.toExecutor({
          rootDir: projectConfig.rootDir,
        }),
      );
    }
  }

  public filterPathsWin32(paths: Array<string>): Array<string> {
    const allFiles = this._context.hasteFS.getAllFiles();
    const options = {nocase: true, windows: false};

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
    projectConfig: Config.ProjectConfig,
    changedFiles?: ChangedFiles,
    filter?: Filter,
  ): Promise<SearchResult> {
    const searchResult = await this._getTestPaths(
      globalConfig,
      projectConfig,
      changedFiles,
    );

    const filterPath = globalConfig.filter;

    if (filter) {
      const tests = searchResult.tests;

      const filterResult = await filter(tests.map(test => test.path));

      if (!Array.isArray(filterResult.filtered)) {
        throw new TypeError(
          `Filter ${filterPath} did not return a valid test list`,
        );
      }

      const filteredSet = new Set(filterResult.filtered);

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
    for (const filePath of changedFiles) {
      if (this.isTestFilePath(filePath)) {
        const sourcePaths = dependencyResolver.resolve(filePath, {
          skipNodeResolution: this._context.config.skipNodeResolution,
        });
        for (const sourcePath of sourcePaths) relatedSourcesSet.add(sourcePath);
      }
    }
    return [...relatedSourcesSet];
  }
}
