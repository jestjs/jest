/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const Resolver = require('jest-resolve');

const path = require('path');
const utils = require('jest-util');
const changedFiles = require('jest-changed-files');

const git = changedFiles.git;
const hg = changedFiles.hg;

function pathToRegex(p) {
  return utils.replacePathSepForRegex(p);
}

function determineSCM(path) {
  return Promise.all([
    git.isGitRepository(path),
    hg.isHGRepository(path),
  ]);
}

class SearchSource {

  constructor(hasteMapPromise, config, options) {
    this._hasteMapPromise = hasteMapPromise;
    this._config = Object.freeze(config);
    this._options = options || {};

    this._testPathDirPattern =
      new RegExp(config.testPathDirs.map(dir => pathToRegex(dir)).join('|'));
    this._testRegex = new RegExp(pathToRegex(config.testRegex));
    const ignorePattern = this._config.testPathIgnorePatterns;
    this._testIgnorePattern =
      ignorePattern.length ? new RegExp(ignorePattern.join('|')) : null;

    this._testPathCases = {
      testPathDirs: path => this._testPathDirPattern.test(path),
      testRegex: path => this._testRegex.test(path),
      testPathIgnorePatterns: path => (!this._testIgnorePattern || !this._testIgnorePattern.test(path)),
    };
  }

  _filterTestPathsWithStats(allPaths, testPathPattern) {
    const data = {
      paths: [],
      stats: {},
      total: allPaths.length,
    };

    const testCases = Object.assign({}, this._testPathCases);
    if (testPathPattern) {
      testCases.testPathPattern = path => new RegExp(testPathPattern).test(path);
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

  _getAllTestPaths(testPathPattern) {
    return this._hasteMapPromise.then(data => (
      this._filterTestPathsWithStats(Object.keys(data.moduleMap.files), testPathPattern)
    ));
  }

  promiseTestPathsMatching(testPathPattern) {
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

  isTestFilePath(path) {
    return Object.keys(this._testPathCases).every(key => (
      this._testPathCases[key](path)
    ));
  }

  promiseTestPathsRelatedTo(allPaths) {
    return this._hasteMapPromise.then(data => {
      const paths = data.resolver.resolveInverseDependencies(
        allPaths,
        this.isTestFilePath.bind(this),
        {
          skipNodeResolution: this._options.skipNodeResolution,
        }
      );
      return {paths};
    });
  }

  findOnlyChangedTestPaths(testRunner, config) {
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
      .then(changedPathSets => this.promiseTestPathsRelatedTo(
        new Set(Array.prototype.concat.apply([], changedPathSets))
      ));
  }

  getTestPaths(patternInfo) {
    if (patternInfo.onlyChanged) {
      return this.findOnlyChangedTestPaths();
    } else {
      return this.promiseTestPathsMatching(patternInfo.testPathPattern);
    }
  }

}

module.exports = SearchSource;
