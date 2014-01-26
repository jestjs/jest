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

      return ModuleLoader.create(config, environment).then(function(moduleLoader) {
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
