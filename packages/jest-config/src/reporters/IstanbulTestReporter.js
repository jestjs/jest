/**
* Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*
* @flow
*/
'use strict';

import type {Config} from 'types/Config';
import type {AggregatedResult, TestResult} from 'types/TestResult';
import type {Process} from 'types/Process';

const DefaultTestReporter = require('./DefaultTestReporter');

const chalk = require('chalk');
const istanbul = require('istanbul');

const FAIL_COLOR = chalk.bold.red;

class IstanbulTestReporter extends DefaultTestReporter {

  _collector: istanbul.Collector;
  _reporter: istanbul.Reporter;
  _testCollectors: Object;

  constructor(customProcess: Process) {
    super(customProcess);

    this._collector = new istanbul.Collector();
    this._testCollectors = Object.create(null);
    this._reporter = new istanbul.Reporter();
  }

  onTestResult(
    config: Config,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ) {
    super.onTestResult(config, testResult, aggregatedResults);

    if (config.collectCoverage && testResult.coverage) {
      const testFilePath = testResult.testFilePath;
      this._collector.add(testResult.coverage);
      if (!this._testCollectors[testFilePath]) {
        this._testCollectors[testFilePath] = new istanbul.Collector();
      }
      this._testCollectors[testFilePath].add(testResult.coverage);
    }
  }

  onRunComplete(config: Config, aggregatedResults: AggregatedResult) {
    aggregatedResults.success = super.onRunComplete(config, aggregatedResults);

    const reporter = this._reporter;
    if (config.collectCoverage) {
      try {
        if (config.coverageDirectory) {
          reporter.dir = config.coverageDirectory;
        }
        reporter.addAll(config.coverageReporters);
        reporter.write(this._collector, true, () => {});
      } catch (e) {}
      if (config.coverageThreshold) {
        const rawCoverage = this._collector.getFinalCoverage();
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
                    `exceeds ${name} threshold (${-1 * threshold})`,
                  );
                }
              } else if (actual < threshold) {
                errors.push(
                  `Jest: Coverage for ${key} (${actual}` +
                  `%) does not meet ${name} threshold (${threshold}%)`,
                );
              }
            }
            return errors;
          }, []);
        }
        const errors = check(
          'global',
          config.coverageThreshold.global,
          globalResults,
        );

        if (errors.length > 0) {
          this.log(`${FAIL_COLOR(errors.join('\n'))}`);
          return false;
        }
      }
    }
    return aggregatedResults.success;
  }

  getReporter() {
    return this._reporter;
  }

  getCollector() {
    return this._collector;
  }

  getTestCollectors() {
    return this._testCollectors;
  }
}

module.exports = IstanbulTestReporter;
