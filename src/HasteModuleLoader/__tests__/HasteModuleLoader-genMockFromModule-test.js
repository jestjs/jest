'use strict';

require('jest-runtime').autoMockOff();

var path = require('path');
var q = require('q');

describe('nodeHasteModuleLoader', function() {
  var genMockFn;
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
    genMockFn = require('jest-runtime').genMockFn;
    HasteModuleLoader = require('../HasteModuleLoader');

    mockEnvironment = {
      global: {
        console: {},
        mockClearTimers: genMockFn()
      },
      runSourceText: genMockFn().mockImplementation(function(codeStr) {
        /* jshint evil:true */
        return (new Function('return ' + codeStr))();
      })
    };
  });

  describe('genMockFromModule', function() {
    pit('does not cause side effects in the rest of the module system when ' +
        'generating a mock', function() {
      return buildLoader().then(function(loader) {
        var testRequire = loader.requireModule.bind(loader, __filename);

        var regularModule = testRequire('RegularModule');
        var origModuleStateValue = regularModule.getModuleStateValue();

        testRequire('jest-runtime').dontMock('RegularModule');

        // Generate a mock for a module with side effects
        testRequire('jest-runtime').genMockFromModule('ModuleWithSideEffects');

        expect(regularModule.getModuleStateValue()).toBe(origModuleStateValue);
      });
    });
  });
});
