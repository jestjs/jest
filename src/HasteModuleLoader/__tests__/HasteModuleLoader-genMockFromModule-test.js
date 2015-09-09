/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();
jest.mock('../../JSDomEnvironment');

var path = require('path');
var utils = require('../../lib/utils');

describe('nodeHasteModuleLoader', function() {
  var HasteModuleLoader;
  var JSDomEnvironment;
  var resourceMap;

  var CONFIG = utils.normalizeConfig({
    name: 'nodeHasteModuleLoader-tests',
    rootDir: path.resolve(__dirname, 'test_root')
  });

  function buildLoader() {
    if (!resourceMap) {
      return HasteModuleLoader.loadResourceMap(CONFIG).then(function(map) {
        resourceMap = map;
        return buildLoader();
      });
    } else {
      var mockEnvironment = new JSDomEnvironment(CONFIG);
      return Promise.resolve(
        new HasteModuleLoader(CONFIG, mockEnvironment, resourceMap)
      );
    }
  }

  beforeEach(function() {
    HasteModuleLoader = require('../HasteModuleLoader');
    JSDomEnvironment = require('../../JSDomEnvironment');
  });

  describe('genMockFromModule', function() {
    pit('does not cause side effects in the rest of the module system when ' +
        'generating a mock', function() {
      return buildLoader().then(function(loader) {
        var testRequire = loader.requireModule.bind(loader, __filename);

        var regularModule = testRequire('RegularModule');
        var origModuleStateValue = regularModule.getModuleStateValue();

        testRequire('jest-runtime').dontMock('RegularModule');

        // Generate a mock for a module with side effects
        testRequire('jest-runtime').genMockFromModule('ModuleWithSideEffects');

        expect(regularModule.getModuleStateValue()).toBe(origModuleStateValue);
      });
    });
  });
});
