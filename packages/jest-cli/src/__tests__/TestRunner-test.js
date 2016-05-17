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

describe('TestRunner', () => {
  const name = 'TestRunner';
  let TestRunner;
  let runner;

  beforeEach(() => {
    TestRunner = require('../TestRunner');
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

  describe('promiseTestPathsRelatedTo', () => {
    const rootDir = path.join(
      __dirname,
      '..',
      'Runtime',
      '__tests__',
      'test_root'
    );
    const rootPath = path.join(rootDir, 'root.js');
    const config = normalizeConfig({
      cacheDirectory: global.CACHE_DIRECTORY,
      name: 'TestRunner-promiseTestPathsRelatedTo-tests',
      rootDir,
      // In order to test the reverse-dependency-resolution we assume
      // every file is a test file in the test directory.
      testPathPattern: '',
    });

    beforeEach(() => {
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
