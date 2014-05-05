'use strict';

jest.autoMockOff();

var path = require('path');
var q = require('q');

describe('nodeHasteModuleLoader', function() {
  var HasteModuleLoader;
  var mockEnvironment;
  var resourceMap;

  var CONFIG = {
    projectName: 'nodeHasteModuleLoader-tests',
    testPathDirs: [path.resolve(__dirname, 'test_root')]
  };

  function buildLoader(config) {
    config = config || CONFIG;
    if (!resourceMap) {
      return HasteModuleLoader.loadResourceMap(config).then(function(map) {
        resourceMap = map;
        return buildLoader(config);
      });
    } else {
      return q(new HasteModuleLoader(config, mockEnvironment, resourceMap));
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
  });
});
