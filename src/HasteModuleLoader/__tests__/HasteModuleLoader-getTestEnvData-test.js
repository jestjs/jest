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
jest.mock('../../environments/JSDOMEnvironment');

const path = require('path');
const utils = require('../../lib/utils');

describe('HasteModuleLoader', function() {
  let HasteModuleLoader;
  let JSDOMEnvironment;

  const rootDir = path.join(__dirname, 'test_root');
  const rootPath = path.join(rootDir, 'root.js');
  const config = utils.normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'HasteModuleLoader-getTestEnvData-tests',
    rootDir,
    testEnvData: {someTestData: 42},
  });
  beforeEach(function() {
    JSDOMEnvironment = require('../../environments/JSDOMEnvironment');
    HasteModuleLoader = require('../HasteModuleLoader');
  });

  function buildLoader() {
    return (new HasteModuleLoader(config, new JSDOMEnvironment(config)))
      .resolveDependencies('./root.js');
  }

  pit('passes config data through to jest.envData', function() {
    return buildLoader().then(function(loader) {
      const root = loader.requireModule(rootDir, rootPath);
      const envData = root.jest.getTestEnvData();
      expect(envData).toEqual(config.testEnvData);
    });
  });

  pit('freezes jest.envData object', function() {
    return buildLoader().then(function(loader) {
      const root = loader.requireModule(rootDir, rootPath);
      const envData = root.jest.getTestEnvData();
      expect(Object.isFrozen(envData)).toBe(true);
    });
  });
});
