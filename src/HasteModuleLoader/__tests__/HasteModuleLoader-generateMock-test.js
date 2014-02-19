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

  describe('generateMock', function() {
    pit('does not cause side effects in the rest of the module system when ' +
        'generating a mock', function() {
      return buildLoader().then(function(loader) {
        var testRequire = loader.requireModule.bind(loader, __filename);

        var regularModule = testRequire('RegularModule');
        var origModuleStateValue = regularModule.getModuleStateValue();

        testRequire('mock-modules').dontMock('RegularModule');
        var mockedModuleWithSideEffects =
          testRequire('mock-modules').generateMock('ModuleWithSideEffects');

        expect(regularModule.getModuleStateValue()).toBe(origModuleStateValue);
      });
    });
  });
});
