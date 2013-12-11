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

  /**
   * jasmine + promises = clowntown
   *
   * This is a helper function to make it simpler to just supply a promise, and
   * ensure any expect()s that happen allong the way to its fulfillment are
   * heard.
   *
   * TODO: It's stupid that this is in this test. It's useful in lots of tests!
   *       We should package it as a jasmine add-on
   */
  function pit(specName, promiseBuilder) {
    it(specName, function() {
      var isFinished = false;
      var error = null;

      runs(function() {
        try {
          var promise = promiseBuilder();
          if (promise !== undefined) {
            promise
              .catch(function(err) { error = err; isFinished = true; })
              .done(function() { isFinished = true; });
          } else {
            isFinished = true;
          }
        } catch (e) {
          error = e;
          isFinished = true;
        }
      });

      waitsFor(function() { return isFinished; });
      runs(function() { if (error) throw error; });
    });
  }

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

  describe('requireModuleOrMock', function() {
    pit('mocks requires by default', function() {
      return buildLoader().then(function(loader) {

      });
    });
  });
});
