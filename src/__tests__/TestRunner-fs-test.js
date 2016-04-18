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
const normalizeConfig = require('../config/normalize');
const TestRunner = require('../TestRunner');

const name = 'TestRunner-fs';

describe('TestRunner-fs', () => {

  describe('testPathsMatching', () => {

    pit('finds tests with default file extensions', () => {
      const rootDir = path.resolve(__dirname, 'test_root');
      const runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testDirectoryName: '__testtests__',
      }), {
        maxWorkers: 1,
      });
      return runner.promiseTestPathsMatching(/.*/).then(paths => {
        const relPaths = paths.map(absPath => path.relative(rootDir, absPath));
        expect(relPaths).toEqual([path.normalize('__testtests__/test.js')]);
      });
    });

    pit('finds tests with similar but custom file extensions', () => {
      const rootDir = path.resolve(__dirname, 'test_root');
      const runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testDirectoryName: '__testtests__',
        testFileExtensions: ['jsx'],
      }), {
        maxWorkers: 1,
      });
      return runner.promiseTestPathsMatching(/.*/).then(paths => {
        const relPaths = paths.map(absPath => path.relative(rootDir, absPath));
        expect(relPaths).toEqual([path.normalize('__testtests__/test.jsx')]);
      });
    });

    pit('finds tests with totally custom foobar file extensions', () => {
      const rootDir = path.resolve(__dirname, 'test_root');
      const runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testDirectoryName: '__testtests__',
        testFileExtensions: ['foobar'],
      }), {
        maxWorkers: 1,
      });
      return runner.promiseTestPathsMatching(/.*/).then(paths => {
        const relPaths = paths.map(absPath => path.relative(rootDir, absPath));
        expect(relPaths).toEqual([path.normalize('__testtests__/test.foobar')]);
      });
    });

    pit('finds tests with many kinds of file extensions', () => {
      const rootDir = path.resolve(__dirname, 'test_root');
      const runner = new TestRunner(normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testDirectoryName: '__testtests__',
        testFileExtensions: ['js', 'jsx'],
      }), {
        maxWorkers: 1,
      });
      return runner.promiseTestPathsMatching(/.*/).then(paths => {
        const relPaths = paths.map(absPath => path.relative(rootDir, absPath));
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });

  });

});
