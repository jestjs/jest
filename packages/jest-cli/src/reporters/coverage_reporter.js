/**
* Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*
* @flow
*/

import type {
  AggregatedResult,
  CoverageMap,
  SerializableError,
  TestResult,
} from 'types/TestResult';
import type {GlobalConfig} from 'types/Config';
import type {Context} from 'types/Context';
import type {Test} from 'types/TestRunner';

type CoverageReporterOptions = {
  maxWorkers: number,
};

import {clearLine} from 'jest-util';
import {createReporter} from 'istanbul-api';
import chalk from 'chalk';
import isCI from 'is-ci';
import istanbulCoverage from 'istanbul-lib-coverage';
import libSourceMaps from 'istanbul-lib-source-maps';
import pify from 'pify';
import workerFarm from 'worker-farm';
import BaseReporter from './base_reporter';
import CoverageWorker from './coverage_worker';

const FAIL_COLOR = chalk.bold.red;
const RUNNING_TEST_COLOR = chalk.bold.dim;

const isInteractive = process.stdout.isTTY && !isCI;

class CoverageReporter extends BaseReporter {
  _coverageMap: CoverageMap;
  _globalConfig: GlobalConfig;
  _sourceMapStore: any;
  _maxWorkers: number;

  constructor(globalConfig: GlobalConfig, options: CoverageReporterOptions) {
    super();
    this._coverageMap = istanbulCoverage.createCoverageMap({});
    this._globalConfig = globalConfig;
    this._sourceMapStore = libSourceMaps.createSourceMapStore();
    this._maxWorkers = options.maxWorkers;
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
        let coverage;
        try {
          coverage = this._coverageMap.fileCoverageFor(sourcePath);
        } finally {
          let { data: { inputSourceMap } = {} } = coverage;
          if (inputSourceMap) {
            this._sourceMapStore.registerMap(
              sourcePath,
              inputSourceMap,
            );
          } else {
            this._sourceMapStore.registerURL(
              sourcePath,
              testResult.sourceMaps[sourcePath],
            );
          }
        }
      });
    }
  }

  async onRunComplete(
    contexts: Set<Context>,
    aggregatedResults: AggregatedResult,
  ) {
    await this._addUntestedFiles(this._globalConfig, contexts);
    let map = this._coverageMap;
    let sourceFinder: Object;
    if (this._globalConfig.mapCoverage) {
      ({map, sourceFinder} = this._sourceMapStore.transformCoverage(map));
    }

    const reporter = createReporter();
    try {
      if (this._globalConfig.coverageDirectory) {
        reporter.dir = this._globalConfig.coverageDirectory;
      }

      let coverageReporters = this._globalConfig.coverageReporters || [];
      if (
        !this._globalConfig.useStderr &&
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
        chalk.red(`
        Failed to write coverage reports:
        ERROR: ${e.toString()}
        STACK: ${e.stack}
      `),
      );
    }

    this._checkThreshold(this._globalConfig, map);
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
      worker = pify(CoverageWorker);
    } else {
      farm = workerFarm(
        {
          autoStart: true,
          maxConcurrentCallsPerWorker: 1,
          maxConcurrentWorkers: this._maxWorkers,
          maxRetries: 2,
        },
        require.resolve('./coverage_worker'),
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
