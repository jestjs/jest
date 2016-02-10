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

describe('TestRunner', () => {
  const name = 'TestRunner';
  let TestRunner;
  let runner;

  beforeEach(() => {
    TestRunner = require('../TestRunner');
  });

  describe('_isTestFilePath', () => {

    beforeEach(() => {
      const utils = require('../lib/utils');
      jest.mock('../resolvers/HasteResolver');
      runner = new TestRunner(utils.normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir: '.',
        testPathDirs: [],
      }));
    });

    it('supports ../ paths and unix separators', () => {
      const path = '/path/to/__tests__/foo/bar/baz/../../../test.js';
      expect(runner._isTestFilePath(path)).toEqual(true);
    });

    it('supports unix separators', () => {
      const path = '/path/to/__tests__/test.js';
      expect(runner._isTestFilePath(path)).toEqual(true);
    });

  });

  describe('promiseTestPathsRelatedTo', () => {
    const rootDir = path.join(
      __dirname,
      '..',
      'HasteModuleLoader',
      '__tests__',
      'test_root'
    );
    const rootPath = path.join(rootDir, 'root.js');
    const config = utils.normalizeConfig({
      cacheDirectory: global.CACHE_DIRECTORY,
      name: 'TestRunner-promiseTestPathsRelatedTo-tests',
      rootDir,
      // In order to test the reverse-dependency-resolution we assume
      // every file is a test file in the test directory.
      testPathPattern: '',
    });

    beforeEach(() => {
      jest.dontMock('../resolvers/HasteResolver');
      runner = new TestRunner(config);
    });

    pit('makes sure a file is related to itself', () => {
      const path = rootPath;

      return runner.promiseTestPathsRelatedTo(new Set([path]))
        .then(relatedTests => {
          expect(relatedTests).toEqual([rootPath]);
        })
        .then(() => runner.end());
    });

    pit('finds tests that depend directly on the path', () => {
      const filePath = path.join(rootDir, 'RegularModule.js');
      const parentDep = path.join(rootDir, 'ModuleWithSideEffects.js');
      return runner.promiseTestPathsRelatedTo(new Set([filePath]))
        .then(relatedTests => {
          expect(relatedTests.sort()).toEqual([
            parentDep,
            filePath,
            rootPath,
          ]);
        })
        .then(() => runner.end());
    });
  });
});
