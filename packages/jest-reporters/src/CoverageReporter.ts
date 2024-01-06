/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {mergeProcessCovs} from '@bcoe/v8-coverage';
import type {EncodedSourceMap} from '@jridgewell/trace-mapping';
import chalk = require('chalk');
import {glob} from 'glob';
import * as fs from 'graceful-fs';
import istanbulCoverage = require('istanbul-lib-coverage');
import istanbulReport = require('istanbul-lib-report');
import libSourceMaps = require('istanbul-lib-source-maps');
import istanbulReports = require('istanbul-reports');
import v8toIstanbul = require('v8-to-istanbul');
import type {
  AggregatedResult,
  RuntimeTransformResult,
  Test,
  TestContext,
  TestResult,
  V8CoverageResult,
} from '@jest/test-result';
import type {Config} from '@jest/types';
import {clearLine, isInteractive} from 'jest-util';
import {type JestWorkerFarm, Worker} from 'jest-worker';
import BaseReporter from './BaseReporter';
import getWatermarks from './getWatermarks';
import type {ReporterContext} from './types';

type CoverageWorker = typeof import('./CoverageWorker');

const FAIL_COLOR = chalk.bold.red;
const RUNNING_TEST_COLOR = chalk.bold.dim;

export default class CoverageReporter extends BaseReporter {
  private readonly _context: ReporterContext;
  private readonly _coverageMap: istanbulCoverage.CoverageMap;
  private readonly _globalConfig: Config.GlobalConfig;
  private readonly _sourceMapStore: libSourceMaps.MapStore;
  private readonly _v8CoverageResults: Array<V8CoverageResult>;

  static readonly filename = __filename;

  constructor(globalConfig: Config.GlobalConfig, context: ReporterContext) {
    super();
    this._context = context;
    this._coverageMap = istanbulCoverage.createCoverageMap({});
    this._globalConfig = globalConfig;
    this._sourceMapStore = libSourceMaps.createSourceMapStore();
    this._v8CoverageResults = [];
  }

  override onTestResult(_test: Test, testResult: TestResult): void {
    if (testResult.v8Coverage) {
      this._v8CoverageResults.push(testResult.v8Coverage);
      return;
    }

    if (testResult.coverage) {
      this._coverageMap.merge(testResult.coverage);
    }
  }

  override async onRunComplete(
    testContexts: Set<TestContext>,
    aggregatedResults: AggregatedResult,
  ): Promise<void> {
    await this._addUntestedFiles(testContexts);
    const {map, reportContext} = await this._getCoverageResult();

    try {
      const coverageReporters = this._globalConfig.coverageReporters || [];

      if (!this._globalConfig.useStderr && coverageReporters.length === 0) {
        coverageReporters.push('text-summary');
      }
      for (let reporter of coverageReporters) {
        let additionalOptions = {};
        if (Array.isArray(reporter)) {
          [reporter, additionalOptions] = reporter;
        }
        istanbulReports
          .create(reporter, {
            maxCols: process.stdout.columns || Number.POSITIVE_INFINITY,
            ...additionalOptions,
          })
          .execute(reportContext);
      }
      aggregatedResults.coverageMap = map;
    } catch (error: any) {
      console.error(
        chalk.red(`
        Failed to write coverage reports:
        ERROR: ${error.toString()}
        STACK: ${error.stack}
      `),
      );
    }

    this._checkThreshold(map);
  }

  private async _addUntestedFiles(
    testContexts: Set<TestContext>,
  ): Promise<void> {
    const files: Array<{config: Config.ProjectConfig; path: string}> = [];

    for (const context of testContexts) {
      const config = context.config;
      if (
        this._globalConfig.collectCoverageFrom &&
        this._globalConfig.collectCoverageFrom.length > 0
      ) {
        for (const filePath of context.hasteFS.matchFilesWithGlob(
          this._globalConfig.collectCoverageFrom,
          config.rootDir,
        ))
          files.push({
            config,
            path: filePath,
          });
      }
    }

    if (files.length === 0) {
      return;
    }

    if (isInteractive) {
      process.stderr.write(
        RUNNING_TEST_COLOR('Running coverage on untested files...'),
      );
    }

    let worker:
      | JestWorkerFarm<CoverageWorker>
      | typeof import('./CoverageWorker');

    if (this._globalConfig.maxWorkers <= 1) {
      worker = require('./CoverageWorker');
    } else {
      worker = new Worker(require.resolve('./CoverageWorker'), {
        enableWorkerThreads: this._globalConfig.workerThreads,
        exposedMethods: ['worker'],
        forkOptions: {serialization: 'json'},
        maxRetries: 2,
        numWorkers: this._globalConfig.maxWorkers,
      }) as JestWorkerFarm<CoverageWorker>;
    }

    const instrumentation = files.map(async fileObj => {
      const filename = fileObj.path;
      const config = fileObj.config;

      const hasCoverageData = this._v8CoverageResults.some(v8Res =>
        v8Res.some(innerRes => innerRes.result.url === filename),
      );

      if (
        !hasCoverageData &&
        !this._coverageMap.data[filename] &&
        'worker' in worker
      ) {
        try {
          const result = await worker.worker({
            config,
            context: {
              changedFiles: this._context.changedFiles && [
                ...this._context.changedFiles,
              ],
              sourcesRelatedToTestsInChangedFiles: this._context
                .sourcesRelatedToTestsInChangedFiles && [
                ...this._context.sourcesRelatedToTestsInChangedFiles,
              ],
            },
            globalConfig: this._globalConfig,
            path: filename,
          });

          if (result) {
            if (result.kind === 'V8Coverage') {
              this._v8CoverageResults.push([
                {codeTransformResult: undefined, result: result.result},
              ]);
            } else {
              this._coverageMap.addFileCoverage(result.coverage);
            }
          }
        } catch (error: any) {
          console.error(
            chalk.red(
              [
                `Failed to collect coverage from ${filename}`,
                `ERROR: ${error.message}`,
                `STACK: ${error.stack}`,
              ].join('\n'),
            ),
          );
        }
      }
    });

    try {
      await Promise.all(instrumentation);
    } catch {
      // Do nothing; errors were reported earlier to the console.
    }

    if (isInteractive) {
      clearLine(process.stderr);
    }

    if (worker && 'end' in worker && typeof worker.end === 'function') {
      await worker.end();
    }
  }

  private _checkThreshold(map: istanbulCoverage.CoverageMap) {
    const {coverageThreshold} = this._globalConfig;

    if (coverageThreshold) {
      function check(
        name: string,
        thresholds: Config.CoverageThresholdValue,
        actuals: istanbulCoverage.CoverageSummaryData,
      ) {
        return (
          ['statements', 'branches', 'lines', 'functions'] as Array<
            keyof istanbulCoverage.CoverageSummaryData
          >
        ).reduce<Array<string>>((errors, key) => {
          const actual = actuals[key].pct;
          const actualUncovered = actuals[key].total - actuals[key].covered;
          const threshold = thresholds[key];

          if (threshold !== undefined) {
            if (threshold < 0) {
              if (threshold * -1 < actualUncovered) {
                errors.push(
                  `Jest: Uncovered count for ${key} (${actualUncovered}) ` +
                    `exceeds ${name} threshold (${-1 * threshold})`,
                );
              }
            } else if (actual < threshold) {
              errors.push(
                `Jest: "${name}" coverage threshold for ${key} (${threshold}%) not met: ${actual}%`,
              );
            }
          }
          return errors;
        }, []);
      }

      const THRESHOLD_GROUP_TYPES = {
        GLOB: 'glob',
        GLOBAL: 'global',
        PATH: 'path',
      };
      const coveredFiles = map.files();
      const thresholdGroups = Object.keys(coverageThreshold);
      const groupTypeByThresholdGroup: {[index: string]: string} = {};
      const filesByGlob: {[index: string]: Array<string>} = {};

      const coveredFilesSortedIntoThresholdGroup = coveredFiles.reduce<
        Array<[string, string | undefined]>
      >((files, file) => {
        const pathOrGlobMatches = thresholdGroups.reduce<
          Array<[string, string]>
        >((agg, thresholdGroup) => {
          // Preserve trailing slash, but not required if root dir
          // See https://github.com/jestjs/jest/issues/12703
          const resolvedThresholdGroup = path.resolve(thresholdGroup);
          const suffix =
            (thresholdGroup.endsWith(path.sep) ||
              (process.platform === 'win32' && thresholdGroup.endsWith('/'))) &&
            !resolvedThresholdGroup.endsWith(path.sep)
              ? path.sep
              : '';
          const absoluteThresholdGroup = `${resolvedThresholdGroup}${suffix}`;

          // The threshold group might be a path:

          if (file.indexOf(absoluteThresholdGroup) === 0) {
            groupTypeByThresholdGroup[thresholdGroup] =
              THRESHOLD_GROUP_TYPES.PATH;
            return [...agg, [file, thresholdGroup]];
          }

          // If the threshold group is not a path it might be a glob:

          // Note: glob.sync is slow. By memoizing the files matching each glob
          // (rather than recalculating it for each covered file) we save a tonne
          // of execution time.
          if (filesByGlob[absoluteThresholdGroup] === undefined) {
            filesByGlob[absoluteThresholdGroup] = glob
              .sync(absoluteThresholdGroup, {windowsPathsNoEscape: true})
              .map(filePath => path.resolve(filePath));
          }

          if (filesByGlob[absoluteThresholdGroup].includes(file)) {
            groupTypeByThresholdGroup[thresholdGroup] =
              THRESHOLD_GROUP_TYPES.GLOB;
            return [...agg, [file, thresholdGroup]];
          }

          return agg;
        }, []);

        if (pathOrGlobMatches.length > 0) {
          return [...files, ...pathOrGlobMatches];
        }

        // Neither a glob or a path? Toss it in global if there's a global threshold:
        if (thresholdGroups.includes(THRESHOLD_GROUP_TYPES.GLOBAL)) {
          groupTypeByThresholdGroup[THRESHOLD_GROUP_TYPES.GLOBAL] =
            THRESHOLD_GROUP_TYPES.GLOBAL;
          return [...files, [file, THRESHOLD_GROUP_TYPES.GLOBAL]];
        }

        // A covered file that doesn't have a threshold:
        return [...files, [file, undefined]];
      }, []);

      const getFilesInThresholdGroup = (thresholdGroup: string) =>
        coveredFilesSortedIntoThresholdGroup
          .filter(fileAndGroup => fileAndGroup[1] === thresholdGroup)
          .map(fileAndGroup => fileAndGroup[0]);

      function combineCoverage(filePaths: Array<string>) {
        return filePaths
          .map(filePath => map.fileCoverageFor(filePath))
          .reduce(
            (
              combinedCoverage:
                | istanbulCoverage.CoverageSummary
                | null
                | undefined,
              nextFileCoverage: istanbulCoverage.FileCoverage,
            ) => {
              if (combinedCoverage === undefined || combinedCoverage === null) {
                return nextFileCoverage.toSummary();
              }
              return combinedCoverage.merge(nextFileCoverage.toSummary());
            },
            undefined,
          );
      }

      let errors: Array<string> = [];

      for (const thresholdGroup of thresholdGroups) {
        switch (groupTypeByThresholdGroup[thresholdGroup]) {
          case THRESHOLD_GROUP_TYPES.GLOBAL: {
            const coverage = combineCoverage(
              getFilesInThresholdGroup(THRESHOLD_GROUP_TYPES.GLOBAL),
            );
            if (coverage) {
              errors = [
                ...errors,
                ...check(
                  thresholdGroup,
                  coverageThreshold[thresholdGroup],
                  coverage,
                ),
              ];
            }
            break;
          }
          case THRESHOLD_GROUP_TYPES.PATH: {
            const coverage = combineCoverage(
              getFilesInThresholdGroup(thresholdGroup),
            );
            if (coverage) {
              errors = [
                ...errors,
                ...check(
                  thresholdGroup,
                  coverageThreshold[thresholdGroup],
                  coverage,
                ),
              ];
            }
            break;
          }
          case THRESHOLD_GROUP_TYPES.GLOB:
            for (const fileMatchingGlob of getFilesInThresholdGroup(
              thresholdGroup,
            )) {
              errors = [
                ...errors,
                ...check(
                  fileMatchingGlob,
                  coverageThreshold[thresholdGroup],
                  map.fileCoverageFor(fileMatchingGlob).toSummary(),
                ),
              ];
            }

            break;
          default:
            // If the file specified by path is not found, error is returned.
            if (thresholdGroup !== THRESHOLD_GROUP_TYPES.GLOBAL) {
              errors = [
                ...errors,
                `Jest: Coverage data for ${thresholdGroup} was not found.`,
              ];
            }
          // Sometimes all files in the coverage data are matched by
          // PATH and GLOB threshold groups in which case, don't error when
          // the global threshold group doesn't match any files.
        }
      }

      errors = errors.filter(
        err => err !== undefined && err !== null && err.length > 0,
      );

      if (errors.length > 0) {
        this.log(`${FAIL_COLOR(errors.join('\n'))}`);
        this._setError(new Error(errors.join('\n')));
      }
    }
  }

  private async _getCoverageResult(): Promise<{
    map: istanbulCoverage.CoverageMap;
    reportContext: istanbulReport.Context;
  }> {
    if (this._globalConfig.coverageProvider === 'v8') {
      const mergedCoverages = mergeProcessCovs(
        this._v8CoverageResults.map(cov => ({result: cov.map(r => r.result)})),
      );

      const fileTransforms = new Map<string, RuntimeTransformResult>();

      for (const res of this._v8CoverageResults)
        for (const r of res) {
          if (r.codeTransformResult && !fileTransforms.has(r.result.url)) {
            fileTransforms.set(r.result.url, r.codeTransformResult);
          }
        }

      const transformedCoverage = await Promise.all(
        mergedCoverages.result.map(async res => {
          const fileTransform = fileTransforms.get(res.url);

          let sourcemapContent: EncodedSourceMap | undefined = undefined;

          if (
            fileTransform?.sourceMapPath &&
            fs.existsSync(fileTransform.sourceMapPath)
          ) {
            sourcemapContent = JSON.parse(
              fs.readFileSync(fileTransform.sourceMapPath, 'utf8'),
            );
          }

          const converter = v8toIstanbul(
            res.url,
            fileTransform?.wrapperLength ?? 0,
            fileTransform && sourcemapContent
              ? {
                  originalSource: fileTransform.originalCode,
                  source: fileTransform.code,
                  sourceMap: {
                    sourcemap: {file: res.url, ...sourcemapContent},
                  },
                }
              : {source: fs.readFileSync(res.url, 'utf8')},
          );

          await converter.load();

          converter.applyCoverage(res.functions);

          const istanbulData = converter.toIstanbul();

          return istanbulData;
        }),
      );

      const map = istanbulCoverage.createCoverageMap({});

      for (const res of transformedCoverage) map.merge(res);

      const reportContext = istanbulReport.createContext({
        coverageMap: map,
        dir: this._globalConfig.coverageDirectory,
        watermarks: getWatermarks(this._globalConfig),
      });

      return {map, reportContext};
    }

    const map = await this._sourceMapStore.transformCoverage(this._coverageMap);
    const reportContext = istanbulReport.createContext({
      coverageMap: map,
      dir: this._globalConfig.coverageDirectory,
      sourceFinder: this._sourceMapStore.sourceFinder,
      watermarks: getWatermarks(this._globalConfig),
    });

    return {map, reportContext};
  }
}
