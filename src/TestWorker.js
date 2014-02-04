var optimist = require('optimist');
var path = require('path');
var utils = require('./lib/utils');
var workerUtils = require('node-worker-pool/nodeWorkerUtils');

function _serializeConsoleArguments(type, args) {
  return {
    type: type,
    args: Array.prototype.map.call(
      args,
      utils.serializeConsoleArgValue
    )
  };
}

if (require.main === module) {
  try {
    var argv = optimist.demand([
      'config',
      'moduleLoader',
      'environmentBuilder',
      'testRunner'
    ]).argv;

    var config = JSON.parse(argv.config);

    var ModuleLoader = require(argv.moduleLoader);
    var environmentBuilder = require(argv.environmentBuilder);
    var testRunner = require(argv.testRunner);

    // Memoize the file content for the environment setup script
    var setupEnvScriptContent = null;
    if (config.setupEnvScriptFile) {
      setupEnvScriptContent = utils.readAndPreprocessFileContent(
        config.setupEnvScriptFile,
        config
      );
    }

    // Longer term we should do something smarter and more efficient like prime
    // the haste map in the parent thread (exactly once), then pass the haste
    // map down to all the children.
    //
    // Even this hack still sucks because it means all children are competing to
    // update the haste cache when they first boot. This is massively redundant
    // and inefficient.
    ModuleLoader.loadResourceMap(config).done(function(resourceMap) {
      workerUtils.startWorker(function(message) {
        var testRunStats = {start: Date.now()};
        var testFilePath = message.testFilePath;
        var environment = environmentBuilder();

        // Capture console logs so they are properly passed through the
        // worker response back to the parent thread
        var consoleMessages = [];
        environment.global.console = {
          error: function() {
            consoleMessages.push(_serializeConsoleArguments('error', arguments));
          },

          log: function() {
            consoleMessages.push(_serializeConsoleArguments('log', arguments));
          },

          warn: function() {
            consoleMessages.push(_serializeConsoleArguments('warn', arguments));
          }
        };

        var moduleLoader = new ModuleLoader(config, environment, resourceMap);
        if (setupEnvScriptContent) {
          utils.runContentWithLocalBindings(
            environment.runSourceText,
            setupEnvScriptContent,
            config.setupEnvScriptFile,
            {
              __dirname: path.dirname(config.setupEnvScriptFile),
              __filename: config.setupEnvScriptFile,
              require: moduleLoader.constructBoundRequire(
                config.setupEnvScriptFile
              )
            }
          );
        }

        return testRunner(config, environment, moduleLoader, testFilePath)
          .then(function(results) {
            testRunStats.end = Date.now();
            results.consoleMessages = consoleMessages;
            results.stats = testRunStats;
            return results;
          });
      });
    });
  } catch (e) {
    workerUtils.respondWithError(e);
  }
}
