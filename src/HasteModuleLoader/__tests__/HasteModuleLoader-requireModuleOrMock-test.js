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

  var CONFIG = utils.normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'HasteModuleLoader-requireModuleOrMock-tests',
    rootDir: path.resolve(__dirname, 'test_root'),
    moduleNameMapper: {
      '^image![a-zA-Z0-9$_-]+$': 'GlobalImageStub',
      '^[./a-zA-Z0-9$_-]+\.png$': 'RelativeImageStub',
    },
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

  describe('requireModuleOrMock', function() {
    pit('mocks modules by default', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModuleOrMock(null, 'RegularModule');
        expect(exports.setModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit('doesnt mock modules when explicitly dontMock()ed', function() {
      return buildLoader().then(function(loader) {
        loader.getJestRuntime().dontMock('RegularModule');
        var exports = loader.requireModuleOrMock(null, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit(
      'doesnt mock modules when explicitly dontMock()ed via a different ' +
      'denormalized module name',
      function() {
        return buildLoader().then(function(loader) {
          loader.getJestRuntime(__filename)
            .dontMock('./test_root/RegularModule');
          var exports = loader.requireModuleOrMock(__filename, 'RegularModule');
          expect(exports.isRealModule).toBe(true);
        });
      }
    );

    pit('doesnt mock modules when autoMockOff() has been called', function() {
      return buildLoader().then(function(loader) {
        loader.getJestRuntime().autoMockOff();
        var exports = loader.requireModuleOrMock(null, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('uses manual mock when automocking on and mock is avail', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModuleOrMock(null, 'ManuallyMocked');
        expect(exports.isManualMockModule).toBe(true);
      });
    });

    pit(
      'does not use manual mock when automocking is off and a real module is ' +
      'available',
      function() {
        return buildLoader().then(function(loader) {
          loader.getJestRuntime(__filename).autoMockOff();
          var exports = loader.requireModuleOrMock(
            __filename,
            'ManuallyMocked'
          );
          expect(exports.isManualMockModule).toBe(false);
        });
      }
    );

    pit('resolves mapped module names and unmocks them by default', function() {
      return buildLoader().then(function(loader) {
        loader.getJestRuntime(__filename);
        var exports =
          loader.requireModuleOrMock(__filename, 'image!not-really-a-module');
        expect(exports.isGlobalImageStub).toBe(true);

        exports = loader.requireModuleOrMock(__filename, 'cat.png');
        expect(exports.isRelativeImageStub).toBe(true);

        exports = loader.requireModuleOrMock(__filename, 'dog.png');
        expect(exports.isRelativeImageStub).toBe(true);
      });
    });
  });
});
