'use strict';

var DefaultTestReporter = require('./DefaultTestReporter');
var istanbul = require('istanbul');
var collector = new istanbul.Collector();
var reporter = new istanbul.Reporter();

class IstanbulTestReporter extends DefaultTestReporter {
  onTestResult(config, testResult, aggregatedResults) {
    super.onTestResult(config, testResult, aggregatedResults);

    if (config.collectCoverage && testResult.coverage) {
      collector.add(testResult.coverage);
    }
  }

  onRunComplete(config, aggregatedResults) {
    super.onRunComplete(config, aggregatedResults);

    if (config.collectCoverage) {
      reporter.addAll(config.coverageReporters);
      reporter.write(collector, true, function () {
        console.log('All reports generated');
      });
    }
  }
}

module.exports = IstanbulTestReporter;
