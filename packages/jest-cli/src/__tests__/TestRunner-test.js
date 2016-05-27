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

jest.disableAutomock();

const path = require('path');

const rootDir = path.resolve(__dirname, 'test_root');
const testRegex = path.sep + '__testtests__' + path.sep;
const testPathPattern = /.*/;

let normalizeConfig;

describe('TestRunner', () => {
  const name = 'TestRunner';
  let TestRunner;
  let runner;

  beforeEach(() => {
    TestRunner = require('../TestRunner');
    normalizeConfig = require('../config/normalize');
  });

  describe('isTestFilePath', () => {

    beforeEach(() => {
      runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir: '.',
        testPathDirs: [],
      }), {
        maxWorkers: 1,
      });
    });

    it('supports ../ paths and unix separators', () => {
      if (process.platform !== 'win32') {
        const path = '/path/to/__tests__/foo/bar/baz/../../../test.js';
        expect(runner.isTestFilePath(path)).toEqual(true);
      }
    });

    it('supports unix separators', () => {
      if (process.platform !== 'win32') {
        const path = '/path/to/__tests__/test.js';
        expect(runner.isTestFilePath(path)).toEqual(true);
      }
    });

    it('supports win32 separators', () => {
      if (process.platform === 'win32') {
        const path = '\\path\\to\\__tests__\\test.js';
        expect(runner.isTestFilePath(path)).toEqual(true);
      }
    });
  });

  describe('testPathsMatching', () => {
    it('finds tests matching a pattern', () => {
      const runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testPathPattern,
        moduleFileExtensions: ['js', 'jsx', 'txt'],
        testRegex: 'not-really-a-test',
      }), {
        maxWorkers: 1,
      });
      return runner.promiseTestPathsMatching().then(data => {
        const relPaths = data.paths.map(absPath => path.relative(rootDir, absPath));
        expect(relPaths).toEqual([
          path.normalize('__testtests__/not-really-a-test.txt'),
        ]);
      });
    });

    it('finds tests matching a JS pattern', () => {
      const runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testPathPattern,
        moduleFileExtensions: ['js', 'jsx'],
        testRegex: 'test\.jsx?',
      }), {
        maxWorkers: 1,
      });
      return runner.promiseTestPathsMatching().then(data => {
        const relPaths = data.paths.map(absPath => path.relative(rootDir, absPath));
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });

    it('finds tests with default file extensions', () => {
      const runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testRegex,
        testPathPattern,
      }), {
        maxWorkers: 1,
      });
      return runner.promiseTestPathsMatching().then(data => {
        const relPaths = data.paths.map(absPath => path.relative(rootDir, absPath));
        expect(relPaths).toEqual([
          path.normalize('__testtests__/test.js'),
        ]);
      });
    });

    it('finds tests with similar but custom file extensions', () => {
      const runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testRegex,
        testPathPattern,
        moduleFileExtensions: ['jsx'],
      }), {
        maxWorkers: 1,
      });
      return runner.promiseTestPathsMatching().then(data => {
        const relPaths = data.paths.map(absPath => path.relative(rootDir, absPath));
        expect(relPaths).toEqual([
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });

    it('finds tests with totally custom foobar file extensions', () => {
      const runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testRegex,
        testPathPattern,
        moduleFileExtensions: ['foobar'],
      }), {
        maxWorkers: 1,
      });
      return runner.promiseTestPathsMatching().then(data => {
        const relPaths = data.paths.map(absPath => path.relative(rootDir, absPath));
        expect(relPaths).toEqual([
          path.normalize('__testtests__/test.foobar'),
        ]);
      });
    });

    it('finds tests with many kinds of file extensions', () => {
      const runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testRegex,
        testPathPattern,
        moduleFileExtensions: ['js', 'jsx'],
      }), {
        maxWorkers: 1,
      });
      return runner.promiseTestPathsMatching().then(data => {
        const relPaths = data.paths.map(absPath => path.relative(rootDir, absPath));
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });

    it('supports legacy APIs', () => {
      const runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testPathPattern,
        testDirectoryName: '__testtests__',
      }), {
        maxWorkers: 1,
      });
      return runner.promiseTestPathsMatching().then(data => {
        const relPaths = data.paths.map(absPath => path.relative(rootDir, absPath));
        expect(relPaths).toEqual([
          path.normalize('__testtests__/test.js'),
        ]);
      });
    });

    it('supports legacy APIs', () => {
      const runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testPathPattern,
        testFileExtensions: ['js', 'jsx'],
      }), {
        maxWorkers: 1,
      });
      return runner.promiseTestPathsMatching().then(data => {
        const relPaths = data.paths.map(absPath => path.relative(rootDir, absPath));
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
          path.normalize('module.jsx'),
        ]);
      });
    });

    it('supports legacy APIs', () => {
      const runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testPathPattern,
        testDirectoryName: '__testtests__',
        testFileExtensions: ['js', 'jsx', 'foobar'],
      }), {
        maxWorkers: 1,
      });
      return runner.promiseTestPathsMatching().then(data => {
        const relPaths = data.paths.map(absPath => path.relative(rootDir, absPath));
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.foobar'),
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });
  });

  describe('promiseTestPathsRelatedTo', () => {
    const rootDir = path.join(
      __dirname,
      '..',
      'Runtime',
      '__tests__',
      'test_root'
    );
    const rootPath = path.join(rootDir, 'root.js');

    beforeEach(() => {
      const config = normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name: 'TestRunner-promiseTestPathsRelatedTo-tests',
        rootDir,
      });
      runner = new TestRunner(config, {
        maxWorkers: 1,
      });
    });

    it('makes sure a file is related to itself', () => {
      return runner.promiseTestPathsRelatedTo(new Set([rootPath]))
        .then(relatedTests => {
          expect(relatedTests).toEqual([rootPath]);
        });
    });

    it('finds tests that depend directly on the path', () => {
      const filePath = path.join(rootDir, 'RegularModule.js');
      const parentDep = path.join(rootDir, 'ModuleWithSideEffects.js');
      return runner.promiseTestPathsRelatedTo(new Set([filePath]))
        .then(relatedTests => {
          expect(relatedTests.sort()).toEqual([
            parentDep,
            filePath,
            rootPath,
          ]);
        });
    });
  });
});
