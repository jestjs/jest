var optimist = require('optimist');
var TestRunner = require('./TestRunner');
var workerUtils = require('node-worker-pool/nodeWorkerUtils');

if (require.main === module) {
  try {
    var argv = optimist.demand(['config']).argv;
    var config = JSON.parse(argv.config);
    var testRunner = new TestRunner(config);

    workerUtils.startWorker(function(message) {
      return testRunner.runTest(message.testFilePath);
    });
  } catch (e) {
    workerUtils.respondWithError(e);
  }
}
