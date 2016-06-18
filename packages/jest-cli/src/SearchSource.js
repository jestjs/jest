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

import type {HasteResolverContext} from './types';
import type {Path} from 'types/Config';
import type {ResolveModuleConfig} from '../../jest-resolve/src';

const Resolver = require('jest-resolve');

const chalk = require('chalk');
const changedFiles = require('jest-changed-files');
const path = require('path');
const utils = require('jest-util');

type SearchSourceConfig = {
  testPathDirs: Array<Path>,
  testRegex: RegExp,
  testPathIgnorePatterns: Array<RegExp>,
};

type SearchResult = {
  paths: Array<Path>,
  stats?: {[key: string]: number},
  total?: number,
};

type StrOrRegExpPattern = RegExp | string;

type PatternInfo = {
  onlyChanged?: boolean,
  watch?: boolean,
  testPathPattern?: string,
  input?: string,
  shouldTreatInputAsPattern?: boolean,
};

const git = changedFiles.git;
const hg = changedFiles.hg;

const determineSCM = path => Promise.all([
  git.isGitRepository(path),
  hg.isHGRepository(path),
]);
const pathToRegex = p => utils.replacePathSepForRegex(p);
const pluralize =
  (word, count, ending) => `${count} ${word}${count === 1 ? '' : ending}`;

class SearchSource {
  _hasteMap: Promise<HasteResolverContext>;
  _config: SearchSourceConfig;
  _options: ResolveModuleConfig;
  _testPathDirPattern: RegExp;
  _testRegex: RegExp;
  _testIgnorePattern: ?RegExp;
  _testPathCases: {
    testPathDirs: (path: Path) => boolean,
    testRegex: (path: Path) => boolean,
    testPathIgnorePatterns: (path: Path) => boolean,
  };

  constructor(
    hasteMap: Promise<HasteResolverContext>,
    config: SearchSourceConfig,
    options?: ResolveModuleConfig,
  ) {
    this._hasteMap = hasteMap;
    this._config = config;
    this._options = options || {};

    this._testPathDirPattern =
      new RegExp(config.testPathDirs.map(dir => pathToRegex(dir)).join('|'));
    this._testRegex = new RegExp(pathToRegex(config.testRegex));
    const ignorePattern = config.testPathIgnorePatterns;
    this._testIgnorePattern =
      ignorePattern.length ? new RegExp(ignorePattern.join('|')) : null;

    this._testPathCases = {
      testPathDirs: path => this._testPathDirPattern.test(path),
      testRegex: path => this._testRegex.test(path),
      testPathIgnorePatterns: path => (
        !this._testIgnorePattern ||
        !this._testIgnorePattern.test(path)
      ),
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
      const regex = new RegExp(testPathPattern);
      testCases.testPathPattern =
        path => regex.test(path);
    }

    data.paths = allPaths.filter(path => {
      return Object.keys(testCases).reduce((flag, key) => {
        if (testCases[key](path)) {
          data.stats[key] = ++data.stats[key] || 1;
          return flag && true;
        }
        data.stats[key] = data.stats[key] || 0;
        return false;
      }, true);
    });

    return data;
  }

  _getAllTestPaths(
    testPathPattern: StrOrRegExpPattern
  ): Promise<SearchResult> {
    return this._hasteMap.then(data => (
      this._filterTestPathsWithStats(
        Object.keys(data.moduleMap.files),
        testPathPattern
      )
    ));
  }

  isTestFilePath(path: Path): boolean {
    return Object.keys(this._testPathCases).every(key => (
      this._testPathCases[key](path)
    ));
  }

  findMatchingTests(
    testPathPattern: StrOrRegExpPattern
  ): Promise<SearchResult> {
    if (testPathPattern && !(testPathPattern instanceof RegExp)) {
      const maybeFile = path.resolve(process.cwd(), testPathPattern);
      if (Resolver.fileExists(maybeFile)) {
        return Promise.resolve(
          this._filterTestPathsWithStats([maybeFile])
        );
      }
    }

    return this._getAllTestPaths(testPathPattern);
  }

  findRelatedTests(allPaths: Set<Path>): Promise<SearchResult> {
    return this._hasteMap
      .then(data => ({
        paths: data.resolver.resolveInverseDependencies(
          allPaths,
          this.isTestFilePath.bind(this),
          {
            skipNodeResolution: this._options.skipNodeResolution,
          }
        ),
      }));
  }

  findOnlyChangedTestPaths(): Promise<SearchResult> {
    return Promise.all(this._config.testPathDirs.map(determineSCM))
      .then(repos => {
        if (!repos.every(result => result[0] || result[1])) {
          throw new Error(
            'It appears that one of your testPathDirs does not exist ' +
            'within a git or hg repository. Currently `--onlyChanged` ' +
            'only works with git or hg projects.'
          );
        }
        return Promise.all(Array.from(repos).map(repo => {
          return repo[0]
            ? git.findChangedFiles(repo[0])
            : hg.findChangedFiles(repo[1]);
        }));
      })
      .then(changedPathSets => this.findRelatedTests(
        new Set(Array.prototype.concat.apply([], changedPathSets))
      ));
  }

  getNoTestsFoundMessage(
    patternInfo: PatternInfo,
    config: {[key: string]: string},
    data: SearchResult,
  ): string {
    if (patternInfo.onlyChanged) {
      const guide = patternInfo.watch
        ? 'starting Jest with `jest --watch=all`'
        : 'running Jest without `-o`';
      return 'No tests found related to changed and uncommitted files.\n' +
        'Note: If you are using dynamic `require`-calls or no tests related ' +
        'to your changed files can be found, consider ' + guide + '.';
    }

    const pattern = patternInfo.testPathPattern;
    const input = patternInfo.input;
    const formattedPattern = `/${pattern}/`;
    const formattedInput = patternInfo.shouldTreatInputAsPattern
      ? `/${input}/`
      : `"${input}"`;
    const testPathPattern =
      (input === pattern) ? formattedInput : formattedPattern;

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
      `${chalk.bold.red('NO TESTS FOUND')}. ` +
      `${pluralize('file', data.total, 's')} checked.\n${statsMessage}`
    );
  }

  getTestPaths(patternInfo: PatternInfo): Promise<SearchResult> {
    if (patternInfo.onlyChanged) {
      return this.findOnlyChangedTestPaths();
    } else if (patternInfo.testPathPattern != null) {
      return this.findMatchingTests(patternInfo.testPathPattern);
    } else {
      return Promise.resolve({paths: []});
    }
  }

}

module.exports = SearchSource;
