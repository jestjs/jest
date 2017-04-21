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

import type {AggregatedResult, CoverageMap, TestResult} from 'types/TestResult';
import type {GlobalConfig} from 'types/Config';
import type {Context} from 'types/Context';
import type {Test} from 'types/TestRunner';

const BaseReporter = require('./BaseReporter');

const {clearLine} = require('jest-util');
const {createReporter} = require('istanbul-api');
const chalk = require('chalk');
const fs = require('fs');
const generateEmptyCoverage = require('../generateEmptyCoverage');
const isCI = require('is-ci');
const istanbulCoverage = require('istanbul-lib-coverage');
const libSourceMaps = require('istanbul-lib-source-maps');

const FAIL_COLOR = chalk.bold.red;
const RUNNING_TEST_COLOR = chalk.bold.dim;

const isInteractive = process.stdout.isTTY && !isCI;

class CoverageReporter extends BaseReporter {
  _coverageMap: CoverageMap;
  _sourceMapStore: any;

  constructor() {
    super();
    this._coverageMap = istanbulCoverage.createCoverageMap({});
    this._sourceMapStore = libSourceMaps.createSourceMapStore();
  }

  onTestResult(
    test: Test,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ) {
    if (testResult.coverage) {
      this._coverageMap.merge(testResult.coverage);
      // Remove coverage data to free up some memory.
      delete testResult.coverage;

      Object.keys(testResult.sourceMaps).forEach(sourcePath => {
        this._sourceMapStore.registerURL(
          sourcePath,
          testResult.sourceMaps[sourcePath],
        );
      });
    }
  }

  onRunComplete(
    contexts: Set<Context>,
    config: GlobalConfig,
    aggregatedResults: AggregatedResult,
  ) {
    this._addUntestedFiles(contexts);
    let map = this._coverageMap;
    let sourceFinder: Object;
    if (config.mapCoverage) {
      ({map, sourceFinder} = this._sourceMapStore.transformCoverage(map));
    }

    const reporter = createReporter();
    try {
      if (config.coverageDirectory) {
        reporter.dir = config.coverageDirectory;
      }

      let coverageReporters = config.coverageReporters || [];
      if (
        !config.useStderr &&
        coverageReporters.length &&
        coverageReporters.indexOf('text') === -1
      ) {
        coverageReporters = coverageReporters.concat(['text-summary']);
      }

      reporter.addAll(coverageReporters);
      reporter.write(map, sourceFinder && {sourceFinder});
      aggregatedResults.coverageMap = map;
    } catch (e) {
      console.error(
        chalk.red(
          `
        Failed to write coverage reports:
        ERROR: ${e.toString()}
        STACK: ${e.stack}
      `,
        ),
      );
    }

    this._checkThreshold(map, config);
  }

  _addUntestedFiles(contexts: Set<Context>) {
    const files = [];
    contexts.forEach(context => {
      const config = context.config;
      if (config.collectCoverageFrom && config.collectCoverageFrom.length) {
        context.hasteFS
          .matchFilesWithGlob(config.collectCoverageFrom, config.rootDir)
          .forEach(filePath =>
            files.push({
              config,
              path: filePath,
            }),
          );
      }
    });
    if (files.length) {
      if (isInteractive) {
        process.stderr.write(
          RUNNING_TEST_COLOR('Running coverage on untested files...'),
        );
      }
      files.forEach(({config, path}) => {
        if (!this._coverageMap.data[path]) {
          try {
            const source = fs.readFileSync(path).toString();
            const result = generateEmptyCoverage(source, path, config);
            if (result) {
              this._coverageMap.addFileCoverage(result.coverage);
              if (result.sourceMapPath) {
                this._sourceMapStore.registerURL(path, result.sourceMapPath);
              }
            }
          } catch (e) {
            console.error(
              chalk.red(
                `
              Failed to collect coverage from ${path}
              ERROR: ${e}
              STACK: ${e.stack}
            `,
              ),
            );
          }
        }
      });
      if (isInteractive) {
        clearLine(process.stderr);
      }
    }
  }

  _checkThreshold(map: CoverageMap, config: GlobalConfig) {
    if (config.coverageThreshold) {
      const results = map.getCoverageSummary().toJSON();

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
      const errors = check('global', config.coverageThreshold.global, results);

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
