var utils = require('./lib/utils');
var jsdom = require('jsdom').jsdom;
var mockTimers = require('./lib/mockTimers');
var optimist = require('optimist');
var path = require('path');
var Q = require('q');
var workerUtils = require('node-worker-pool/nodeWorkerUtils');

var timer = {
  _currName: '',
  _startTime: 0,
  start: function(name) {
    this._startTime = Date.now();
    this._currName = name;
  },
  end: function() {
    var end = Date.now();
    this.times[this._currName] = end - this._startTime;
  },
  times: {}
};

function JSDomTestRunner(config, ModuleLoaderClass, testFrameworkRunner) {
  this._ModuleLoaderClass = ModuleLoaderClass;
  this._testFrameworkRunner = testFrameworkRunner;

  this._setupEnvScriptContent = null;
  this._setupEnvScriptFilePath = null;
  if (config.setupEnvScriptFile) {
    this._setupEnvScriptContent = utils.readAndPreprocessFileContent(
      config.setupEnvScriptFile,
      config
    );
    this._setupEnvScriptFilePath = config.setupEnvScriptFile;
  }
}

JSDomTestRunner.prototype.runTestByPath = function(testFilePath) {
  timer.start('jsdomInit');
  var jsdomWindow = jsdom().parentWindow;

  // Stuff jsdom doesn't support out of the box
  jsdomWindow.location.host = jsdomWindow.location.hostname = '';
  jsdomWindow.navigator.onLine = true;
  jsdomWindow.ArrayBuffer = ArrayBuffer;
  jsdomWindow.Float32Array = Float32Array;
  jsdomWindow.Int16Array = Int16Array;
  jsdomWindow.Int32Array = Int32Array;
  jsdomWindow.Int8Array = Int8Array;
  jsdomWindow.Uint8Array = Uint8Array;
  jsdomWindow.Uint16Array = Uint16Array;
  jsdomWindow.Uint32Array = Uint32Array;
  jsdomWindow.DataView = DataView;
  jsdomWindow.Buffer = Buffer;
  timer.end();

  timer.start('installMockTimers');
  mockTimers.reset();
  mockTimers.installMockTimers(jsdomWindow);
  timer.end();

  // I kinda wish tests just did this manually rather than relying on a
  // helper function to do it, but I'm keeping it for backward compat reasons
  // while we get jest deployed internally. Then we can look into removing it.
  //
  // #3376754
  if (!jsdomWindow.hasOwnProperty('mockSetReadOnlyProperty')) {
    jsdomWindow.mockSetReadOnlyProperty = function(obj, property, value) {
      obj.__defineGetter__(property, function() {
        return value;
      });
    };
  }

  timer.start('jsdomEnvSetup');
  if (this._setupEnvScriptContent) {
    var tmpLoader = new this._ModuleLoaderClass(jsdomWindow, jsdomWindow.run);
    var setupEnvRequire = tmpLoader.requireModule.bind(
      tmpLoader,
      this._setupEnvScriptFilePath
    );
    var setupEnvRequireMock = tmpLoader.requireMock.bind(
      tmpLoader,
      this._setupEnvScriptFilePath
    );
    utils.runContentWithLocalBindings(
      jsdomWindow.run,
      this._setupEnvScriptContent,
      this._setupEnvScriptFilePath,
      {
        __dirname: path.dirname(this._setupEnvScriptFilePath),
        __filename: this._setupEnvScriptFilePath,
        console: console,
        require: setupEnvRequire,
        requireMock: setupEnvRequireMock
      }
    );
  }
  timer.end();

  var jobTimer = Object.create(timer);
  jobTimer.times = {bootTimes: timer.times};

  // Capture console.logs so they can be passed through the worker response
  var consoleMessages = [];
  jsdomWindow.console = {
    error: function() {
      var args = Array.prototype.map.call(
        arguments,
        utils.serializeConsoleArgValue
      );
      consoleMessages.push({type: 'error', args: args});
    },
    log: function() {
      var args = Array.prototype.map.call(
        arguments,
        utils.serializeConsoleArgValue
      );
      consoleMessages.push({type: 'log', args: args});
    },
    warn: function() {
      // TODO: Should this be a no-op? jstest doesn't proxy it through to
      //       the console, but I don't see a good reason not to?
      var args = Array.prototype.map.call(
        arguments,
        utils.serializeConsoleArgValue
      );
      consoleMessages.push({type: 'warn', args: args});
    }
  };

  // Pass through the node `process` global.
  // TODO: Consider locking this down somehow so tests can't do crazy stuff to
  //       worker processes...
  jsdomWindow.process = process;

  jobTimer.start('createModuleLoader');
  var moduleLoader = new this._ModuleLoaderClass(
    jsdomWindow,
    jsdomWindow.run
  );
  jobTimer.end();

  jobTimer.start('runTest');
  return this._testFrameworkRunner(
    jsdomWindow,
    jsdomWindow.run,
    function() {
      return moduleLoader.requireModule(
        testFilePath,
        './' + path.basename(testFilePath)
      );
    }
  ).then(function(results) {
    jobTimer.end();
    results.times = jobTimer.times;
    results.consoleMessages = consoleMessages;
    return results;
  });
}

if (require.main === module) {
  try {
    var argv = optimist.demand(['config']).argv;
    var config = JSON.parse(argv.config);

    var moduleLoader = require(config.moduleLoader);
    var testFrameworkRunner = require(config.testFramework).runTest;
    return moduleLoader.initialize(config).done(function(ModuleLoaderClass) {
      var testRunner = new JSDomTestRunner(
        config,
        ModuleLoaderClass,
        testFrameworkRunner
      );
      workerUtils.startWorker(function(message) {
        return testRunner.runTestByPath(message.testFilePath);
      });
    });
  } catch (e) {
    workerUtils.respondWithError(e);
  }
}

module.exports = JSDomTestRunner;
