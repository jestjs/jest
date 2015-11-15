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

describe('nodeHasteModuleLoader', function() {
  var HasteModuleLoader;
  var JSDOMEnvironment;
  var resourceMap;

  var CONFIG = utils.normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'nodeHasteModuleLoader-genMockFromModule-tests',
    rootDir: path.resolve(__dirname, 'test_root'),
  });

  function buildLoader() {
    if (!resourceMap) {
      return HasteModuleLoader.loadResourceMap(CONFIG).then(function(map) {
        resourceMap = map;
        return buildLoader();
      });
    } else {
      var mockEnvironment = new JSDOMEnvironment(CONFIG);
      return Promise.resolve(
        new HasteModuleLoader(CONFIG, mockEnvironment, resourceMap)
      );
    }
  }

  beforeEach(function() {
    HasteModuleLoader = require('../HasteModuleLoader');
    JSDOMEnvironment = require('../../environments/JSDOMEnvironment');
  });

  describe('genMockFromModule', function() {
    pit(
      'does not cause side effects in the rest of the module system when ' +
      'generating a mock',
      function() {
        return buildLoader().then(function(loader) {
          var testRequire = loader.requireModule.bind(loader, __filename);

          var regularModule = testRequire('RegularModule');
          var origModuleStateValue = regularModule.getModuleStateValue();

          loader.getJestRuntime().dontMock('RegularModule');

          // Generate a mock for a module with side effects
          loader.getJestRuntime().genMockFromModule(
            'ModuleWithSideEffects'
          );

          expect(regularModule.getModuleStateValue()).toBe(
            origModuleStateValue
          );
        });
      }
    );
  });
});
