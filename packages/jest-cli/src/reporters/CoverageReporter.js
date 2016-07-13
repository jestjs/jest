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

const BaseReporter = require('./BaseReporter');

const chalk = require('chalk');
const istanbul = require('istanbul');

const FAIL_COLOR = chalk.bold.red;

class CoverageReporter extends BaseReporter {
  _collector: istanbul.Collector;
  _testCollectors: Object;

  constructor() {
    super();
    this._collector = new istanbul.Collector();
    this._testCollectors = Object.create(null);
  }

  onTestResult(
    config: Config,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ) {
    if (testResult.coverage) {
      const testFilePath = testResult.testFilePath;
      this._collector.add(testResult.coverage);
      if (!this._testCollectors[testFilePath]) {
        this._testCollectors[testFilePath] = new istanbul.Collector();
      }
      this._testCollectors[testFilePath].add(testResult.coverage);
    }
  }

  onRunComplete(config: Config, aggregatedResults: AggregatedResult) {
    const reporter = new istanbul.Reporter();
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
        this._setError(new Error(errors.join('\n')));
      }
    }
  }

  getTestCollectors() {
    return this._testCollectors;
  }
}

module.exports = CoverageReporter;
