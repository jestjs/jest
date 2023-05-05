/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {
  AggregatedResult,
  SnapshotSummary,
  TestContext,
} from '@jest/test-result';
import type {Config} from '@jest/types';
import {testPathPatternToRegExp} from 'jest-util';
import BaseReporter from './BaseReporter';
import getResultHeader from './getResultHeader';
import getSnapshotSummary from './getSnapshotSummary';
import getSummary from './getSummary';
import type {ReporterOnStartOptions} from './types';

const NPM_EVENTS = new Set([
  'prepublish',
  'publish',
  'postpublish',
  'preinstall',
  'install',
  'postinstall',
  'preuninstall',
  'uninstall',
  'postuninstall',
  'preversion',
  'version',
  'postversion',
  'pretest',
  'test',
  'posttest',
  'prestop',
  'stop',
  'poststop',
  'prestart',
  'start',
  'poststart',
  'prerestart',
  'restart',
  'postrestart',
]);

const {npm_config_user_agent, npm_lifecycle_event, npm_lifecycle_script} =
  process.env;

export type SummaryReporterOptions = {
  summaryThreshold?: number;
};

export default class SummaryReporter extends BaseReporter {
  private _estimatedTime: number;
  private readonly _globalConfig: Config.GlobalConfig;
  private readonly _summaryThreshold: number;

  static readonly filename = __filename;

  constructor(
    globalConfig: Config.GlobalConfig,
    options?: SummaryReporterOptions,
  ) {
    super();
    this._globalConfig = globalConfig;
    this._estimatedTime = 0;
    this._validateOptions(options);
    this._summaryThreshold = options?.summaryThreshold ?? 20;
  }

  private _validateOptions(options?: SummaryReporterOptions) {
    if (
      options?.summaryThreshold &&
      typeof options.summaryThreshold !== 'number'
    ) {
      throw new TypeError('The option summaryThreshold should be a number');
    }
  }

  // If we write more than one character at a time it is possible that
  // Node.js exits in the middle of printing the result. This was first observed
  // in Node.js 0.10 and still persists in Node.js 6.7+.
  // Let's print the test failure summary character by character which is safer
  // when hundreds of tests are failing.
  private _write(string: string) {
    for (let i = 0; i < string.length; i++) {
      process.stderr.write(string.charAt(i));
    }
  }

  override onRunStart(
    aggregatedResults: AggregatedResult,
    options: ReporterOnStartOptions,
  ): void {
    super.onRunStart(aggregatedResults, options);
    this._estimatedTime = options.estimatedTime;
  }

  override onRunComplete(
    testContexts: Set<TestContext>,
    aggregatedResults: AggregatedResult,
  ): void {
    const {numTotalTestSuites, testResults, wasInterrupted} = aggregatedResults;
    if (numTotalTestSuites) {
      const lastResult = testResults[testResults.length - 1];
      // Print a newline if the last test did not fail to line up newlines
      // similar to when an error would have been thrown in the test.
      if (
        !this._globalConfig.verbose &&
        lastResult &&
        !lastResult.numFailingTests &&
        !lastResult.testExecError
      ) {
        this.log('');
      }

      this._printSummary(aggregatedResults, this._globalConfig);
      this._printSnapshotSummary(
        aggregatedResults.snapshot,
        this._globalConfig,
      );

      let message = getSummary(aggregatedResults, {
        estimatedTime: this._estimatedTime,
        seed: this._globalConfig.seed,
        showSeed: this._globalConfig.showSeed,
      });

      if (!this._globalConfig.silent) {
        message += `\n${
          wasInterrupted
            ? chalk.bold.red('Test run was interrupted.')
            : this._getTestSummary(testContexts, this._globalConfig)
        }`;
      }
      this.log(message);
    }
  }

  private _printSnapshotSummary(
    snapshots: SnapshotSummary,
    globalConfig: Config.GlobalConfig,
  ) {
    if (
      snapshots.added ||
      snapshots.filesRemoved ||
      snapshots.unchecked ||
      snapshots.unmatched ||
      snapshots.updated
    ) {
      let updateCommand;
      const event = npm_lifecycle_event || '';
      const prefix = NPM_EVENTS.has(event) ? '' : 'run ';
      const isYarn =
        typeof npm_config_user_agent === 'string' &&
        npm_config_user_agent.includes('yarn');
      const client = isYarn ? 'yarn' : 'npm';
      const scriptUsesJest =
        typeof npm_lifecycle_script === 'string' &&
        npm_lifecycle_script.includes('jest');

      if (globalConfig.watch || globalConfig.watchAll) {
        updateCommand = 'press `u`';
      } else if (event && scriptUsesJest) {
        updateCommand = `run \`${`${client} ${prefix}${event}${
          isYarn ? '' : ' --'
        }`} -u\``;
      } else {
        updateCommand = 're-run jest with `-u`';
      }

      const snapshotSummary = getSnapshotSummary(
        snapshots,
        globalConfig,
        updateCommand,
      );
      snapshotSummary.forEach(this.log);

      this.log(''); // print empty line
    }
  }

  private _printSummary(
    aggregatedResults: AggregatedResult,
    globalConfig: Config.GlobalConfig,
  ) {
    // If there were any failing tests and there was a large number of tests
    // executed, re-print the failing results at the end of execution output.
    const failedTests = aggregatedResults.numFailedTests;
    const runtimeErrors = aggregatedResults.numRuntimeErrorTestSuites;
    if (
      failedTests + runtimeErrors > 0 &&
      aggregatedResults.numTotalTestSuites > this._summaryThreshold
    ) {
      this.log(chalk.bold('Summary of all failing tests'));
      aggregatedResults.testResults.forEach(testResult => {
        const {failureMessage} = testResult;
        if (failureMessage) {
          this._write(
            `${getResultHeader(testResult, globalConfig)}\n${failureMessage}\n`,
          );
        }
      });
      this.log(''); // print empty line
    }
  }

  private _getTestSummary(
    testContexts: Set<TestContext>,
    globalConfig: Config.GlobalConfig,
  ) {
    const getMatchingTestsInfo = () => {
      const prefix = globalConfig.findRelatedTests
        ? ' related to files matching '
        : ' matching ';

      return (
        chalk.dim(prefix) +
        testPathPatternToRegExp(globalConfig.testPathPattern).toString()
      );
    };

    let testInfo = '';

    if (globalConfig.runTestsByPath) {
      testInfo = chalk.dim(' within paths');
    } else if (globalConfig.onlyChanged) {
      testInfo = chalk.dim(' related to changed files');
    } else if (globalConfig.testPathPattern) {
      testInfo = getMatchingTestsInfo();
    }

    let nameInfo = '';

    if (globalConfig.runTestsByPath) {
      nameInfo = ` ${globalConfig.nonFlagArgs.map(p => `"${p}"`).join(', ')}`;
    } else if (globalConfig.testNamePattern) {
      nameInfo = `${chalk.dim(' with tests matching ')}"${
        globalConfig.testNamePattern
      }"`;
    }

    const contextInfo =
      testContexts.size > 1
        ? chalk.dim(' in ') + testContexts.size + chalk.dim(' projects')
        : '';

    return (
      chalk.dim('Ran all test suites') +
      testInfo +
      nameInfo +
      contextInfo +
      chalk.dim('.')
    );
  }
}
