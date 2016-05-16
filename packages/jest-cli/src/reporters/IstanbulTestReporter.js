/**
* Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/
'use strict';

const DefaultTestReporter = require('./DefaultTestReporter');
const chalk = require('chalk');
const istanbul = require('istanbul');
const collector = new istanbul.Collector();
const testCollectors = Object.create(null);
const reporter = new istanbul.Reporter();

const FAIL_COLOR = chalk.bold.red;

class IstanbulTestReporter extends DefaultTestReporter {
  onTestResult(config, testResult, aggregatedResults) {
    super.onTestResult(config, testResult, aggregatedResults);

    if (config.collectCoverage && testResult.coverage) {
      collector.add(testResult.coverage);
      if (!testCollectors[testResult.testFilePath]) {
        testCollectors[testResult.testFilePath] = new istanbul.Collector();
      }
      testCollectors[testResult.testFilePath].add(testResult.coverage);
    }
  }

  onRunComplete(config, aggregatedResults) {
    super.onRunComplete(config, aggregatedResults);

    if (config.collectCoverage) {
      try {
        if (config.coverageDirectory) {
          reporter.dir = config.coverageDirectory;
        }
        reporter.addAll(config.coverageReporters);
        reporter.write(collector, true, () => {});
      } catch (e) {}
      if (config.coverageThreshold) {
        const rawCoverage = collector.getFinalCoverage();
        const globalResults = istanbul.utils.summarizeCoverage(rawCoverage);

        function check(name, thresholds, actuals) {
          return [
            'statements',
            'branches',
            'lines',
            'functions',
          ].reduce((errors, key) => {
            const actual = actuals[key].pct;
            const actualUncovered = actuals[key].total - actuals[key].covered;
            const threshold = thresholds[key];

            if (threshold != null) {
              if (threshold < 0) {
                if (threshold * -1 < actualUncovered) {
                  errors.push(
                    `Jest: Uncovered count for ${key} (${actualUncovered})` +
                    `exceeds ${name} threshold (${-1 * threshold})`
                  );
                }
              } else if (actual < threshold) {
                errors.push(
                  `Jest: Coverage for ${key} (${actual}` +
                  `%) does not meet ${name} threshold (${threshold}%)`
                );
              }
            }
            return errors;
          }, []);
        }
        const errors = check(
          'global',
          config.coverageThreshold.global,
          globalResults
        );

        if (errors.length > 0) {
          this.log(`${FAIL_COLOR(errors.join('\n'))}`);
          aggregatedResults.success = false;
        }
      }
    }
  }

  static getReporter() {
    return reporter;
  }

  static getCollector() {
    return collector;
  }

  static getTestCollectors() {
    return testCollectors;
  }
}

module.exports = IstanbulTestReporter;
