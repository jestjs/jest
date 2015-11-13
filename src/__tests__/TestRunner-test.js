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

jest.autoMockOff().mock('fs');

const name = 'TestRunner';
describe('TestRunner', () => {
  let TestRunner;

  beforeEach(() => {
    TestRunner = require('../TestRunner');
  });

  describe('_isTestFilePath', () => {
    let runner;

    beforeEach(() => {
      const utils = require('../lib/utils');
      runner = new TestRunner(utils.normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir: '.',
        testPathDirs: [],
      }));
    });

    it('supports ../ paths and unix separators', () => {
      const path = '/path/to/__tests__/foo/bar/baz/../../../test.js';
      const isTestFile = runner._isTestFilePath(path);

      return expect(isTestFile).toEqual(true);
    });

    it('supports unix separators', () => {
      const path = '/path/to/__tests__/test.js';
      const isTestFile = runner._isTestFilePath(path);

      return expect(isTestFile).toEqual(true);
    });

  });

  describe('promiseTestPathsRelatedTo', () => {
    const allTests = [
      '__tests__/a.js',
      '__tests__/b.js',
    ];
    const dependencyGraph = {
      '__tests__/a.js': {resources: {}},
      '__tests__/b.js': {resources: {
        'b.js': {},
      }},
    };
    let runner;

    beforeEach(() => {
      const utils = require('../lib/utils');
      runner = new TestRunner(utils.normalizeConfig({
        cacheDirectory: global.CACHE_DIRECTORY,
        name,
        rootDir: '.',
        testPathDirs: [],
      }));

      runner._isTestFilePath = () => true;
      runner._constructModuleLoader = () => {
        return Promise.resolve({
          getAllTestPaths:
            modulePath => Promise.resolve(allTests),
          _resolver: {
            getDependencies: path => {
              return Promise.resolve(dependencyGraph[path]);
            },
          },
        });
      };
    });

    pit('finds no tests when no tests depend on the path', () => {
      const path = 'a.js';

      return runner.promiseTestPathsRelatedTo(new Set([path]))
        .then(relatedTests => {
          expect(relatedTests).toEqual([]);
        });
    });

    pit('finds tests that depend directly on the path', () => {
      const path = 'b.js';
      return runner.promiseTestPathsRelatedTo(new Set([path]))
        .then(relatedTests => {
          expect(relatedTests).toEqual(['__tests__/b.js']);
        });
    });
  });
});
