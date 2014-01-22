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
    });
  });
});
