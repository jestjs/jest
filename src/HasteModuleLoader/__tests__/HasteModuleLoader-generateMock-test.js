'use strict';

require('mock-modules').autoMockOff();

var path = require('path');
var q = require('q');

describe('nodeHasteModuleLoader', function() {
  var getMockFn;
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
    getMockFn = require('mocks').getMockFunction;
    HasteModuleLoader = require('../HasteModuleLoader');

    mockEnvironment = {
      global: {
        console: {},
        mockClearTimers: getMockFn()
      },
      runSourceText: getMockFn().mockImplementation(function(codeStr) {
        /* jshint evil:true */
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

        // Generate a mock for a module with side effects
        testRequire('mock-modules').generateMock('ModuleWithSideEffects');

        expect(regularModule.getModuleStateValue()).toBe(origModuleStateValue);
      });
    });
  });
});
