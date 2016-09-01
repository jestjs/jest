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

const rootDir = path.resolve(__dirname, 'test_root');
const testRegex = path.sep + '__testtests__' + path.sep;
const maxWorkers = 1;

let findMatchingTests;
let normalizeConfig;

describe('SearchSource', () => {
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

    beforeEach(done => {
      config = normalizeConfig({
        name,
        rootDir: '.',
        testPathDirs: [],
      });
      Runtime.createHasteContext(config, {maxWorkers}).then(hasteMap => {
        searchSource = new SearchSource(hasteMap, config);
        done();
      });
    });

    it('supports ../ paths and unix separators', () => {
      if (process.platform !== 'win32') {
        const path = '/path/to/__tests__/foo/bar/baz/../../../test.js';
        expect(searchSource.isTestFilePath(path)).toEqual(true);
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
        Runtime.createHasteContext(config, {maxWorkers}).then(hasteMap =>
          new SearchSource(hasteMap, config).findMatchingTests(),
        );
    });

    it('finds tests matching a pattern', () => {
      const config = normalizeConfig({
        name,
        rootDir,
        moduleFileExtensions: ['js', 'jsx', 'txt'],
        testRegex: 'not-really-a-test',
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath => (
          path.relative(rootDir, absPath)
        ));
        expect(relPaths).toEqual([
          path.normalize('__testtests__/not-really-a-test.txt'),
        ]);
      });
    });

    it('finds tests matching a JS pattern', () => {
      const config = normalizeConfig({
        name,
        rootDir,
        moduleFileExtensions: ['js', 'jsx'],
        testRegex: 'test\.jsx?',
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath => (
          path.relative(rootDir, absPath)
        ));
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });

    it('finds tests with default file extensions', () => {
      const config = normalizeConfig({
        name,
        rootDir,
        testRegex,
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath => (
          path.relative(rootDir, absPath)
        ));
        expect(relPaths).toEqual([
          path.normalize('__testtests__/test.js'),
        ]);
      });
    });

    it('finds tests with similar but custom file extensions', () => {
      const config = normalizeConfig({
        name,
        rootDir,
        testRegex,
        moduleFileExtensions: ['jsx'],
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath => (
          path.relative(rootDir, absPath)
        ));
        expect(relPaths).toEqual([
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });

    it('finds tests with totally custom foobar file extensions', () => {
      const config = normalizeConfig({
        name,
        rootDir,
        testRegex,
        moduleFileExtensions: ['foobar'],
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath => (
          path.relative(rootDir, absPath)
        ));
        expect(relPaths).toEqual([
          path.normalize('__testtests__/test.foobar'),
        ]);
      });
    });
    it('finds tests with many kinds of file extensions', () => {
      const config = normalizeConfig({
        name,
        rootDir,
        testRegex,
        moduleFileExtensions: ['js', 'jsx'],
      });
      return findMatchingTests(config).then(data => {
        const relPaths = data.paths.map(absPath => (
          path.relative(rootDir, absPath)
        ));
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
      const config = normalizeConfig({
        name: 'SearchSource-findRelatedTests-tests',
        rootDir,
      });
      Runtime.createHasteContext(config, {maxWorkers}).then(hasteMap => {
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
});
