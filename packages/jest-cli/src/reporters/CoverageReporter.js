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

import type {
  AggregatedResult,
  CoverageMap,
  SerializableError,
  TestResult,
} from 'types/TestResult';
import type {GlobalConfig} from 'types/Config';
import type {Context} from 'types/Context';
import type {Test} from 'types/TestRunner';

const BaseReporter = require('./BaseReporter');

const {clearLine} = require('jest-util');
const {createReporter} = require('istanbul-api');
const chalk = require('chalk');
const isCI = require('is-ci');
const istanbulCoverage = require('istanbul-lib-coverage');
const libSourceMaps = require('istanbul-lib-source-maps');
const pify = require('pify');
const workerFarm = require('worker-farm');

const FAIL_COLOR = chalk.bold.red;
const RUNNING_TEST_COLOR = chalk.bold.dim;

const isInteractive = process.stdout.isTTY && !isCI;

class CoverageReporter extends BaseReporter {
  _coverageMap: CoverageMap;
  _maxWorkers: number;
  _sourceMapStore: any;

  constructor({maxWorkers}: {maxWorkers: number}) {
    super();
    this._maxWorkers = maxWorkers;
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

  async onRunComplete(
    contexts: Set<Context>,
    globalConfig: GlobalConfig,
    aggregatedResults: AggregatedResult,
  ) {
    await this._addUntestedFiles(globalConfig, contexts);
    let map = this._coverageMap;
    let sourceFinder: Object;
    if (globalConfig.mapCoverage) {
      ({map, sourceFinder} = this._sourceMapStore.transformCoverage(map));
    }

    const reporter = createReporter();
    try {
      if (globalConfig.coverageDirectory) {
        reporter.dir = globalConfig.coverageDirectory;
      }

      let coverageReporters = globalConfig.coverageReporters || [];
      if (
        !globalConfig.useStderr &&
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

    this._checkThreshold(globalConfig, map);
  }

  _addUntestedFiles(globalConfig: GlobalConfig, contexts: Set<Context>) {
    const files = [];
    contexts.forEach(context => {
      const config = context.config;
      if (
        globalConfig.collectCoverageFrom &&
        globalConfig.collectCoverageFrom.length
      ) {
        context.hasteFS
          .matchFilesWithGlob(globalConfig.collectCoverageFrom, config.rootDir)
          .forEach(filePath =>
            files.push({
              config,
              path: filePath,
            }),
          );
      }
    });
    if (!files.length) {
      return Promise.resolve();
    }

    if (isInteractive) {
      process.stderr.write(
        RUNNING_TEST_COLOR('Running coverage on untested files...'),
      );
    }

    let worker;
    let farm;
    if (this._maxWorkers <= 1) {
      worker = pify(require('./CoverageWorker'));
    } else {
      farm = workerFarm(
        {
          autoStart: true,
          maxConcurrentCallsPerWorker: 1,
          maxConcurrentWorkers: this._maxWorkers,
          maxRetries: 2,
        },
        require.resolve('./CoverageWorker'),
      );
      worker = pify(farm);
    }
    const instrumentation = [];
    files.forEach(fileObj => {
      const filename = fileObj.path;
      const config = fileObj.config;
      if (!this._coverageMap.data[filename]) {
        const promise = worker({
          config,
          globalConfig,
          path: filename,
        })
          .then(result => {
            if (result) {
              this._coverageMap.addFileCoverage(result.coverage);
              if (result.sourceMapPath) {
                this._sourceMapStore.registerURL(
                  filename,
                  result.sourceMapPath,
                );
              }
            }
          })
          .catch((error: SerializableError) => {
            console.error(chalk.red(error.message));
          });
        instrumentation.push(promise);
      }
    });

    const cleanup = () => {
      if (isInteractive) {
        clearLine(process.stderr);
      }
      if (farm) {
        workerFarm.end(farm);
      }
    };

    return Promise.all(instrumentation).then(cleanup).catch(cleanup);
  }

  _checkThreshold(globalConfig: GlobalConfig, map: CoverageMap) {
    if (globalConfig.coverageThreshold) {
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
      const errors = check(
        'global',
        globalConfig.coverageThreshold.global,
        results,
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
