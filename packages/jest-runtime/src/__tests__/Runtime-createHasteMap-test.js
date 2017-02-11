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

const skipOnWindows = require('skipOnWindows');
const path = require('path');
let Runtime;
let normalize;

const TEST_PATH = path.resolve(path.dirname(__filename), 'tmp', 'jest');

describe('Runtime', () => {
  skipOnWindows.suite();

  beforeEach(() => {
    Runtime = require('../');
    normalize = require('jest-config').normalize;
  });

  describe('createHasteMap', () => {
    it('includes files in paths containing partial cacheDirectory', () => {
      const config = normalize({
        name: 'Runtime-createHasteMap-tests',
        rootDir: TEST_PATH,
      });

      return Runtime.createHasteMap(config, {maxWorkers: 1, resetCache: false})
        .build()
        .then(({__hasteMapForTest: data}) => {
          expect(data.files[TEST_PATH + '/sample.js']).toBeDefined();
        });
    });
  });
});
