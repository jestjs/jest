/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

const path = require('path');
const skipOnWindows = require('skipOnWindows');

const rootDir = path.resolve(__dirname, 'test_root');
const testRegex = path.sep + '__testtests__' + path.sep;
const testMatch = ['**/__testtests__/**/*'];
const maxWorkers = 1;

let findMatchingTests;
let normalizeConfig;

describe('SearchSource', () => {
  skipOnWindows.suite();

  const name = 'SearchSource';
  let Runtime;
  let SearchSource;
  let searchSource;

  beforeEach(() => {
    Runtime = require('jest-runtime');
    SearchSource = require('../SearchSource');
    normalizeConfig = require('jest-config').normalize;
  });

  describe('isTestFilePath', () => {
    let config;

    beforeEach(() => {
      config = normalizeConfig({
        name,
        rootDir: '.',
        roots: [],
      }).config;
      return Runtime.createContext(config, {maxWorkers}).then(hasteMap => {
        searchSource = new SearchSource(hasteMap, config);
      });
    });

    // micromatch doesn't support '..' through the globstar ('**') to avoid
    // infinite recursion.

    it('supports ../ paths and unix separators via textRegex', () => {
      if (process.platform !== 'win32') {
        config = normalizeConfig({
          name,
          rootDir: '.',
          roots: [],
          testMatch: null,
          testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.jsx?$',
        }).config;
        return Runtime.createContext(config, {
          maxWorkers,
        }).then(hasteMap => {
          searchSource = new SearchSource(hasteMap, config);

          const path = '/path/to/__tests__/foo/bar/baz/../../../test.js';
          expect(searchSource.isTestFilePath(path)).toEqual(true);
        });
      } else {
        return undefined;
      }
    });

    it('supports unix separators', () => {
      if (process.platform !== 'win32') {
        const path = '/path/to/__tests__/test.js';
        expect(searchSource.isTestFilePath(path)).toEqual(true);
      }
    });

    it('supports win32 separators', () => {
      if (process.platform === 'win32') {
        const path = '\\path\\to\\__tests__\\test.js';
        expect(searchSource.isTestFilePath(path)).toEqual(true);
      }
    });
  });

  describe('testPathsMatching', () => {
    beforeEach(() => {
      findMatchingTests = config =>
        Runtime.createContext(config, {
          maxWorkers,
        }).then(hasteMap =>
          new SearchSource(hasteMap, config).findMatchingTests());
    });

    it('finds tests matching a pattern via testRegex', () => {
      const {config} = normalizeConfig({
        moduleFileExtensions: ['js', 'jsx', 'txt'],
        name,
        rootDir,
        testMatch: null,
        testRegex: 'not-really-a-test',
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths
          .map(absPath => path.relative(rootDir, absPath))
          .sort();
        expect(relPaths).toEqual(
          [
            path.normalize('.hiddenFolder/not-really-a-test.txt'),
            path.normalize('__testtests__/not-really-a-test.txt'),
          ].sort(),
        );
      });
    });

    it('finds tests matching a pattern via testMatch', () => {
      const {config} = normalizeConfig({
        moduleFileExtensions: ['js', 'jsx', 'txt'],
        name,
        rootDir,
        testMatch: ['**/not-really-a-test.txt'],
        testRegex: '',
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths
          .map(absPath => path.relative(rootDir, absPath))
          .sort();
        expect(relPaths).toEqual(
          [
            path.normalize('.hiddenFolder/not-really-a-test.txt'),
            path.normalize('__testtests__/not-really-a-test.txt'),
          ].sort(),
        );
      });
    });

    it('finds tests matching a JS regex pattern', () => {
      const {config} = normalizeConfig({
        moduleFileExtensions: ['js', 'jsx'],
        name,
        rootDir,
        testMatch: null,
        testRegex: 'test\.jsx?',
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath =>
          path.relative(rootDir, absPath));
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });

    it('finds tests matching a JS glob pattern', () => {
      const {config} = normalizeConfig({
        moduleFileExtensions: ['js', 'jsx'],
        name,
        rootDir,
        testMatch: ['**/test.js?(x)'],
        testRegex: '',
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath =>
          path.relative(rootDir, absPath));
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });

    it('finds tests with default file extensions using testRegex', () => {
      const {config} = normalizeConfig({
        name,
        rootDir,
        testMatch: null,
        testRegex,
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath =>
          path.relative(rootDir, absPath));
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });

    it('finds tests with default file extensions using testMatch', () => {
      const {config} = normalizeConfig({
        name,
        rootDir,
        testMatch,
        testRegex: '',
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath =>
          path.relative(rootDir, absPath));
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });

    it('finds tests with similar but custom file extensions', () => {
      const {config} = normalizeConfig({
        moduleFileExtensions: ['jsx'],
        name,
        rootDir,
        testMatch,
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath =>
          path.relative(rootDir, absPath));
        expect(relPaths).toEqual([path.normalize('__testtests__/test.jsx')]);
      });
    });

    it('finds tests with totally custom foobar file extensions', () => {
      const {config} = normalizeConfig({
        moduleFileExtensions: ['foobar'],
        name,
        rootDir,
        testMatch,
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath =>
          path.relative(rootDir, absPath));
        expect(relPaths).toEqual([path.normalize('__testtests__/test.foobar')]);
      });
    });

    it('finds tests with many kinds of file extensions', () => {
      const {config} = normalizeConfig({
        moduleFileExtensions: ['js', 'jsx'],
        name,
        rootDir,
        testMatch,
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath =>
          path.relative(rootDir, absPath));
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });

    it('finds tests using a regex only', () => {
      const {config} = normalizeConfig({
        name,
        rootDir,
        testMatch: null,
        testRegex,
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath =>
          path.relative(rootDir, absPath));
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });

    it('finds tests using a glob only', () => {
      const {config} = normalizeConfig({
        name,
        rootDir,
        testMatch,
        testRegex: '',
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath =>
          path.relative(rootDir, absPath));
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
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

    beforeEach(done => {
      const {config} = normalizeConfig({
        name: 'SearchSource-findRelatedTests-tests',
        rootDir,
      });
      Runtime.createContext(config, {maxWorkers}).then(hasteMap => {
        searchSource = new SearchSource(hasteMap, config);
        done();
      });
    });

    it('makes sure a file is related to itself', () => {
      const data = searchSource.findRelatedTests(new Set([rootPath]));
      expect(data.paths).toEqual([rootPath]);
    });

    it('finds tests that depend directly on the path', () => {
      const filePath = path.join(rootDir, 'RegularModule.js');
      const loggingDep = path.join(rootDir, 'logging.js');
      const parentDep = path.join(rootDir, 'ModuleWithSideEffects.js');
      const data = searchSource.findRelatedTests(new Set([filePath]));
      expect(data.paths.sort()).toEqual([
        parentDep,
        filePath,
        loggingDep,
        rootPath,
      ]);
    });
  });

  describe('findRelatedTestsFromPattern', () => {
    beforeEach(done => {
      const {config} = normalizeConfig({
        moduleFileExtensions: ['js', 'jsx', 'foobar'],
        name,
        rootDir,
        testMatch,
      });
      Runtime.createContext(config, {maxWorkers}).then(hasteMap => {
        searchSource = new SearchSource(hasteMap, config);
        done();
      });
    });

    it('returns empty search result for empty input', () => {
      const input = [];
      const data = searchSource.findRelatedTestsFromPattern(input);
      expect(data.paths).toEqual([]);
    });

    it('returns empty search result for invalid input', () => {
      const input = ['non-existend.js'];
      const data = searchSource.findRelatedTestsFromPattern(input);
      expect(data.paths).toEqual([]);
    });

    it('returns empty search result if no related tests were found', () => {
      const input = ['no tests.js'];
      const data = searchSource.findRelatedTestsFromPattern(input);
      expect(data.paths).toEqual([]);
    });

    it('finds tests for a single file', () => {
      const input = ['packages/jest-cli/src/__tests__/test_root/module.jsx'];
      const data = searchSource.findRelatedTestsFromPattern(input);
      expect(data.paths.sort()).toEqual([
        path.join(rootDir, '__testtests__', 'test.js'),
        path.join(rootDir, '__testtests__', 'test.jsx'),
      ]);
    });

    it('finds tests for multiple files', () => {
      const input = [
        'packages/jest-cli/src/__tests__/test_root/module.jsx',
        'packages/jest-cli/src/__tests__/test_root/module.foobar',
      ];
      const data = searchSource.findRelatedTestsFromPattern(input);
      expect(data.paths.sort()).toEqual([
        path.join(rootDir, '__testtests__', 'test.foobar'),
        path.join(rootDir, '__testtests__', 'test.js'),
        path.join(rootDir, '__testtests__', 'test.jsx'),
      ]);
    });
  });
});
