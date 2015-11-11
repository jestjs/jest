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

var path = require('path');
var utils = require('../../lib/utils');

describe('HasteModuleLoader', function() {
  var HasteModuleLoader;
  var JSDOMEnvironment;
  var resourceMap;

  var config;
  const rootDir = path.join(__dirname, 'test_root');
  const rootPath = path.join(rootDir, 'root.js');
  beforeEach(function() {
    JSDOMEnvironment = require('../../environments/JSDOMEnvironment');
    HasteModuleLoader = require('../HasteModuleLoader');
    config = utils.normalizeConfig({
      cacheDirectory: global.CACHE_DIRECTORY,
      name: 'HasteModuleLoader-getTestEnvData-tests',
      rootDir,
      testEnvData: {someTestData: 42},
    });
  });

  function buildLoader() {
    let promise;
    if (!resourceMap) {
      return HasteModuleLoader.loadResourceMap(config).then(function(map) {
        resourceMap = map;
        return buildLoader();
      });
    } else {
      var mockEnvironment = new JSDOMEnvironment({});
      promise = Promise.resolve(
        new HasteModuleLoader(config, mockEnvironment, resourceMap)
      );
    }

    return promise.then(loader => loader.resolveDependencies('./root.js'));
  }

  pit('passes config data through to jest.envData', function() {
    return buildLoader().then(function(loader) {
      const root = loader.requireModule(rootDir, rootPath)
      var envData = root.jest.getTestEnvData();
      expect(envData).toEqual(config.testEnvData);
    });
  });

  pit('freezes jest.envData object', function() {
    return buildLoader().then(function(loader) {
      const root = loader.requireModule(rootDir, rootPath)
      var envData = root.jest.getTestEnvData();
      expect(Object.isFrozen(envData)).toBe(true);
    });
  });
});
