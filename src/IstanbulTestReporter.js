/**
* Copyright (c) 2014, Facebook, Inc. All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/
'use strict';

const DefaultTestReporter = require('./DefaultTestReporter');
const istanbul = require('istanbul');
const collector = new istanbul.Collector();
const reporter = new istanbul.Reporter();

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
      reporter.write(collector, true, function() {
        console.log('All reports generated');
      });
    }
  }
}

module.exports = IstanbulTestReporter;
