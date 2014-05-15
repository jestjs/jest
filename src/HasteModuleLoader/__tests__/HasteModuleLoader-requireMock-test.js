/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

var path = require('path');
var q = require('q');
var utils = require('../../lib/utils');

describe('HasteModuleLoader', function() {
  var HasteModuleLoader;
  var mockEnvironment;
  var resourceMap;

  var CONFIG = utils.normalizeConfig({
    name: 'HasteModuleLoader-tests',
    rootDir: path.resolve(__dirname, 'test_root')
  });

  function buildLoader() {
    if (!resourceMap) {
      return HasteModuleLoader.loadResourceMap(CONFIG).then(function(map) {
        resourceMap = map;
        return buildLoader(CONFIG);
      });
    } else {
      return q(new HasteModuleLoader(CONFIG, mockEnvironment, resourceMap));
    }
  }

  beforeEach(function() {
    HasteModuleLoader = require('../HasteModuleLoader');

    mockEnvironment = {
      global: {
        console: {},
        mockClearTimers: jest.genMockFn()
      },
      runSourceText: jest.genMockFn().mockImplementation(function(codeStr) {
        /* jshint evil:true */
        return (new Function('return ' + codeStr))();
      })
    };
  });

  describe('requireMock', function() {
    pit('uses manual mocks before attempting to automock', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireMock(null, 'ManuallyMocked');
        expect(exports.isManualMockModule).toBe(true);
      });
    });

    pit('stores and re-uses manual mock exports', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireMock(null, 'ManuallyMocked');
        exports.setModuleStateValue('test value');
        exports = loader.requireMock(null, 'ManuallyMocked');
        expect(exports.getModuleStateValue()).toBe('test value');
      });
    });

    pit('automocks @providesModule modules without a manual mock', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireMock(null, 'RegularModule');
        expect(exports.getModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit('automocks relative-path modules without a file extension', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireMock(
          __filename,
          './test_root/RegularModule'
        );
        expect(exports.getModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit('automocks relative-path modules with a file extension', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireMock(
          __filename,
          './test_root/RegularModule.js'
        );
        expect(exports.getModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit('stores and re-uses automocked @providesModule exports', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireMock(null, 'RegularModule');
        exports.externalMutation = 'test value';
        exports = loader.requireMock(null, 'RegularModule');
        expect(exports.externalMutation).toBe('test value');
      });
    });

    pit('stores and re-uses automocked relative-path modules', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireMock(
          __filename,
          './test_root/RegularModule'
        );
        exports.externalMutation = 'test value';
        exports = loader.requireMock(
          __filename,
          './test_root/RegularModule'
        );
        expect(exports.externalMutation).toBe('test value');
      });
    });

    pit('throws on non-existant @providesModule modules', function() {
      return buildLoader().then(function(loader) {
        expect(function() {
          loader.requireMock(null, 'DoesntExist');
        }).toThrow();
      });
    });

    pit('uses the closest manual mock when duplicates exist', function() {
      return buildLoader().then(function(loader) {
        var exports1 = loader.requireMock(
          __dirname,
          path.resolve(__dirname, './test_root/subdir1/MyModule')
        );
        expect(exports1.modulePath).toEqual(
          'subdir1/__mocks__/MyModule.js'
        );

        var exports2 = loader.requireMock(
          __dirname,
          path.resolve(__dirname, './test_root/subdir2/MyModule')
        );
        expect(exports2.modulePath).toEqual(
          'subdir2/__mocks__/MyModule.js'
        );
      });
    });
  });
});
