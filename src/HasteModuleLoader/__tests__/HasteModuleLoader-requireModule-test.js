require('mock-modules').autoMockOff();

var path = require('path');
var Q = require('q');

describe('nodeHasteModuleLoader', function() {
  var getMockFn;
  var HasteModuleLoader;
  var resourceMap;

  var CONFIG = {
    projectName: "nodeHasteModuleLoader-tests",
    jsScanDirs: [path.resolve(__dirname, 'test_root')]
  };

  function buildLoader(config) {
    config = config || CONFIG;
    if (!resourceMap) {
      return HasteModuleLoader.loadResourceMap(config).then(function(map) {
        resourceMap = map;
        return buildLoader(config);
      });
    } else {
      return Q(new HasteModuleLoader(config, mockEnvironment, resourceMap));
    }
  }

  beforeEach(function() {
    getMockFn = require('mocks').getMockFunction;
    HasteModuleLoader = require('../HasteModuleLoader');

    mockEnvironment = {
      global: {
        console: {},
        mockClearTimers: getMockFn()
      },
      runSourceText: getMockFn().mockImplementation(function(codeStr) {
        return (new Function('return ' + codeStr))();
      })
    };
  });

  describe('requireModule', function() {
    pit('finds @providesModule modules', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModule(null, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('throws on non-existant @providesModule modules', function() {
      return buildLoader().then(function(loader) {
        expect(function() {
          loader.requireModule(null, 'DoesntExist');
        }).toThrow('Cannot find module \'DoesntExist\' from \'.\'');
      });
    });

    pit('finds relative-path modules without file extension', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModule(
          __filename,
          './test_root/RegularModule'
        );
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('finds relative-path modules with file extension', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModule(
          __filename,
          './test_root/RegularModule.js'
        );
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('throws on non-existant relative-path modules', function() {
      return buildLoader().then(function(loader) {
        expect(function() {
          loader.requireModule(__filename, './DoesntExist');
        }).toThrow(
          'Cannot find module \'./DoesntExist\' from \'' + __filename + '\''
        );
      });
    });

    pit('finds node core built-in modules', function() {
      return buildLoader().then(function(loader) {
        expect(function() {
          loader.requireModule(null, 'fs');
        }).not.toThrow();
      });
    });

    pit('finds and loads JSON files without file extension', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModule(__filename, './test_root/JSONFile');
        expect(exports.isJSONModule).toBe(true);
      });
    });

    pit('finds and loads JSON files with file extension', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModule(
          __filename,
          './test_root/JSONFile.json'
        );
        expect(exports.isJSONModule).toBe(true);
      });
    });

    describe('features I want to remove, but must exist for now', function() {
      /**
       * I'd like to kill this and make all tests use something more explicit
       * when they want a manual mock, like:
       *
       *   require.mock('MyManualMock');
       *   var ManuallyMocked = require('ManuallyMocked');
       *
       *   --or--
       *
       *   var ManuallyMocked = require.manualMock('ManuallyMocked');
       *
       * For now, however, this is built-in and many tests rely on it, so we
       * must support it until we can do some cleanup.
       */
      pit('provides manual mock when real module doesnt exist', function() {
        return buildLoader().then(function(loader) {
          var exports = loader.requireModule(
            __filename,
            'ExclusivelyManualMock'
          );
          expect(exports.isExclusivelyManualMockModule).toBe(true);
        });
      });

      /**
       * requireModule() should *always* return the real module. Mocks should
       * only be returned by requireMock().
       *
       * See the 'overrides real modules with manual mock when one exists' test
       * for more info on why I want to kill this feature.
       */
      pit('doesnt override real modules with manual mocks when explicitly ' +
          'marked with .dontMock()', function() {
        return buildLoader().then(function(loader) {
          loader.requireModule(__filename, 'mock-modules').dontMock('ManuallyMocked');
          var exports = loader.requireModule(__filename, 'ManuallyMocked');
          expect(exports.isManualMockModule).toBe(false);
        });
      });

      /**
       * This test is only in this section because it seems sketchy to be able
       * to load up a module without pulling it from the registry. I need to do
       * more investigation to understand the reasoning behind this before I
       * declare it unnecessary and condemn it.
       */
      pit('doesnt read from the module registry when bypassModuleRegistry is ' +
          'set', function() {
        return buildLoader().then(function(loader) {
          var registryExports = loader.requireModule(
            __filename,
            'RegularModule'
          );
          registryExports.setModuleStateValue('registry');

          var bypassedExports = loader.requireModule(
            __filename,
            'RegularModule',
            true
          );
          expect(bypassedExports.getModuleStateValue()).not.toBe('registry');
        });
      });

      pit('doesnt write to the module registry when bypassModuleRegistry is ' +
          'set', function() {
        return buildLoader().then(function(loader) {
          var registryExports = loader.requireModule(
            __filename,
            'RegularModule'
          );
          registryExports.setModuleStateValue('registry');

          var bypassedExports = loader.requireModule(
            __filename,
            'RegularModule',
            true
          );
          bypassedExports.setModuleStateValue('bypassed');

          expect(registryExports.getModuleStateValue()).toBe('registry');
        });
      });
    });
  });
});
