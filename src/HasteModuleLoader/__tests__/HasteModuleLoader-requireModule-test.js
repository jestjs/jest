var path = require('path');

describe('nodeHasteModuleLoader', function() {
  require('mock-modules').autoMockOff();
  var getMockFn;
  var HasteModuleLoader;

  var CONFIG = {
    projectName: "nodeHasteModuleLoader-tests"
  };

  function buildLoader(config) {
    config = config || CONFIG;
    return HasteModuleLoader.create(config, mockEnvironment);
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
    });
  });
});
