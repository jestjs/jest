/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.mock('jest-haste-map', () => {
  return class HeatMapMock {
    constructor(options) {
      this.options = options;
    }
  };
});

const Runtime = require('../');

const defaultHasteConfig = {
  providesModuleNodeModules: [],
};

const defaultConfig = {
  cacheDirectory: '',
  haste: defaultHasteConfig,
  mocksPattern: '',
  moduleFileExtensions: [],
  modulePathIgnorePatterns: [],
  name: '',
  testPathDirs: [],
  watchman: false,
};

const defaultOptions = {
  maxWorkers: 0,
  resetCache: false,
};

describe('Runtime', () => {
  describe('createHasteMap', () => {
    it('retainAllFiles from haste config if provided', () => {
      const haste = Object.assign({}, defaultHasteConfig, {
        retainAllFiles: true,
      });

      const config = Object.assign({}, defaultConfig, {
        haste,
      });

      const hasteMap = Runtime.createHasteMap(config, defaultOptions);

      expect(hasteMap.options.retainAllFiles).toBe(true);
    });

    it('retainAllFiles false if not provided', () => {
      const hasteMap = Runtime.createHasteMap(defaultConfig, defaultOptions);

      expect(hasteMap.options.retainAllFiles).toBe(false);
    });
  });
});
