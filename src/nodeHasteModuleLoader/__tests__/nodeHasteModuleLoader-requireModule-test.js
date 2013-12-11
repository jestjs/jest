var path = require('path');

describe('nodeHasteModuleLoader', function() {
  require('mock-modules').autoMockOff();
  var getMockFn;
  var nodeHasteModuleLoader;

  var mockContextGlobal;
  var mockContextRunner;

  var CONFIG = {
    projectName: "nodeHasteModuleLoader-tests"
  };

  function buildLoader(config) {
    config = config || CONFIG;

    return nodeHasteModuleLoader.initialize(config).then(function(Loader) {
      return new Loader(mockContextGlobal, mockContextRunner);
    });
  }

  function extendConfig(extension) {
    var ret = Object.create(CONFIG);
    for (var key in extension) {
      ret[key] = extension[key];
    }
    return ret;
  }

  beforeEach(function() {
    getMockFn = require('mocks').getMockFunction;
    nodeHasteModuleLoader = require('../loader');

    mockContextGlobal = {
      console: {},
      mockClearTimers: getMockFn()
    };
    mockContextRunner = getMockFn().mockImplementation(function(codeStr) {
      return (new Function('return ' + codeStr))();
    });
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
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('finds and loads JSON files with file extension', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModule(
          __filename,
          './test_root/JSONFile.json'
        );
        expect(exports.isRealModule).toBe(true);
      });
    });
  });
});
