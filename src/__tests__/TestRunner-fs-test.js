/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.autoMockOff();

const path = require('path');
const utils = require('../lib/utils');
const TestRunner = require('../TestRunner');

const name = 'TestRunner-fs';

describe('TestRunner-fs', function() {

  describe('testPathsMatching', function() {

    pit('finds tests with default file extensions', function() {
      const rootDir = path.resolve(__dirname, 'test_root');
      const runner = new TestRunner(utils.normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testDirectoryName: '__testtests__',
      }));
      return runner.promiseTestPathsMatching(/.*/).then(function(paths) {
        const relPaths = paths.map(function(absPath) {
          return path.relative(rootDir, absPath);
        });
        expect(relPaths).toEqual([path.normalize('__testtests__/test.js')]);
        return runner._resolver.end();
      });
    });

    pit('finds tests with similar but custom file extensions', function() {
      const rootDir = path.resolve(__dirname, 'test_root');
      const runner = new TestRunner(utils.normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testDirectoryName: '__testtests__',
        testFileExtensions: ['jsx'],
      }));
      return runner.promiseTestPathsMatching(/.*/).then(function(paths) {
        const relPaths = paths.map(function(absPath) {
          return path.relative(rootDir, absPath);
        });
        expect(relPaths).toEqual([path.normalize('__testtests__/test.jsx')]);
        return runner._resolver.end();
      });
    });

    pit('finds tests with totally custom foobar file extensions', function() {
      const rootDir = path.resolve(__dirname, 'test_root');
      const runner = new TestRunner(utils.normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testDirectoryName: '__testtests__',
        testFileExtensions: ['foobar'],
      }));
      return runner.promiseTestPathsMatching(/.*/).then(function(paths) {
        const relPaths = paths.map(function(absPath) {
          return path.relative(rootDir, absPath);
        });
        expect(relPaths).toEqual([path.normalize('__testtests__/test.foobar')]);
        return runner._resolver.end();
      });
    });

    pit('finds tests with many kinds of file extensions', function() {
      const rootDir = path.resolve(__dirname, 'test_root');
      const runner = new TestRunner(utils.normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir,
        testDirectoryName: '__testtests__',
        testFileExtensions: ['js', 'jsx'],
      }));
      return runner.promiseTestPathsMatching(/.*/).then(function(paths) {
        const relPaths = paths.map(function(absPath) {
          return path.relative(rootDir, absPath);
        });
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
        return runner._resolver.end();
      });
    });

  });

});
