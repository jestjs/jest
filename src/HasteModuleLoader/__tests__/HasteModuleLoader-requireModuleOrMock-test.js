require('mock-modules').autoMockOff();

var path = require('path');
var Q = require('q');

describe('nodeHasteModuleLoader', function() {
  var getMockFn;
  var HasteModuleLoader;
  var mockEnvironment;
  var resourceMap;

  var CONFIG = {
    projectName: "nodeHasteModuleLoader-tests",
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

  describe('requireModuleOrMock', function() {
    pit('mocks modules by default', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModuleOrMock(null, 'RegularModule');
        expect(exports.setModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit('doesnt mock modules when explicitly dontMock()ed', function() {
      return buildLoader().then(function(loader) {
        loader.requireModuleOrMock(null, 'mock-modules').dontMock('RegularModule');
        var exports = loader.requireModuleOrMock(null, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('doesnt mock modules when explicitly dontMock()ed via a different ' +
        'denormalized module name', function() {
      return buildLoader().then(function(loader) {
        var mockModules = loader.requireModuleOrMock(__filename, 'mock-modules');
        mockModules.dontMock('./test_root/RegularModule');
        var exports = loader.requireModuleOrMock(__filename, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('doesnt mock modules when autoMockOff() has been called', function() {
      return buildLoader().then(function(loader) {
        loader.requireModuleOrMock(null, 'mock-modules').autoMockOff();
        var exports = loader.requireModuleOrMock(null, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('uses manual mock when automocking is on and one is available', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModuleOrMock(null, 'ManuallyMocked');
        expect(exports.isManualMockModule).toBe(true);
      });
    });

    pit('does not use manual mock when automocking is off and a real ' +
        'module is available', function() {
      return buildLoader().then(function(loader) {
        loader.requireModuleOrMock(__filename, 'mock-modules').autoMockOff();
        var exports = loader.requireModuleOrMock(__filename, 'ManuallyMocked');
        expect(exports.isManualMockModule).toBe(false);
      });
    });
  });
});
