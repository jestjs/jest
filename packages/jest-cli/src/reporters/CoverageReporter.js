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

import type {AggregatedResult, TestResult} from 'types/TestResult';
import type {Config} from 'types/Config';
import type {RunnerContext} from 'types/Reporters';

type CoverageMap = {
  merge: (data: Object) => void,
  getCoverageSummary: () => Object,
  data: Object,
  addFileCoverage: (fileCoverage: Object) => void,
};

const BaseReporter = require('./BaseReporter');

const {createReporter} = require('istanbul-api');
const chalk = require('chalk');
const fs = require('fs');
const generateEmptyCoverage = require('../generateEmptyCoverage');
const istanbulCoverage = require('istanbul-lib-coverage');

const FAIL_COLOR = chalk.bold.red;
const RUNNING_TEST_COLOR = chalk.bold.gray;

class CoverageReporter extends BaseReporter {
  _coverageMap: CoverageMap;

  constructor() {
    super();
    this._coverageMap = istanbulCoverage.createCoverageMap({});
  }

  onTestResult(
    config: Config,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ) {
    if (testResult.coverage) {
      this._coverageMap.merge(testResult.coverage);
    }
  }

  onRunComplete(
    config: Config,
    aggregatedResults: AggregatedResult,
    runnerContext: RunnerContext,
  ) {
    this._addUntestedFiles(config, runnerContext);
    const reporter = createReporter();
    try {
      if (config.coverageDirectory) {
        reporter.dir = config.coverageDirectory;
      }
      reporter.addAll(config.coverageReporters || []);
      reporter.write(this._coverageMap);
    } catch (e) {
      console.error(chalk.red(`
        Failed to write coverage reports:
        ERROR: ${e.toString()}
        STACK: ${e.stack}
      `));
    }

    this._checkThreshold(config);
  }

  _addUntestedFiles(config: Config, runnerContext: RunnerContext) {
    if (config.collectCoverageFrom && config.collectCoverageFrom.length) {
      process.stderr.write(RUNNING_TEST_COLOR(
        'Running coverage for untested files...',
      ));
      const files = runnerContext.hasteFS.matchFilesWithGlob(
        config.collectCoverageFrom,
        config.rootDir,
      );

      files.forEach(filename => {
        if (!this._coverageMap.data[filename]) {
          try {
            const source = fs.readFileSync(filename).toString();
            this._coverageMap.addFileCoverage(
              generateEmptyCoverage(source, filename, config),
            );
          } catch (e) {
            console.error(chalk.red(`
              Failed to collect coverage from ${filename}
              ERROR: ${e}
              STACK: ${e.stack}
            `));
          }
        }
      });
      this.clearLine();
    }
  }

  _checkThreshold(config: Config) {
    if (config.coverageThreshold) {
      const globalResults = this._coverageMap.getCoverageSummary().toJSON();

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

  // Only exposed for the internal runner. Should not be used
  getCoverageMap(): CoverageMap {
    return this._coverageMap;
  }
}

module.exports = CoverageReporter;
