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
