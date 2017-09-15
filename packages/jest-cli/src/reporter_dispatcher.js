/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Context} from 'types/Context';
import type {Reporter, Test} from 'types/TestRunner';
import type {TestResult, AggregatedResult} from 'types/TestResult';
import type {ReporterOnStartOptions} from 'types/Reporters';
import type {GlobalConfig, ReporterConfig} from 'types/Config';

import CoverageReporter from './reporters/coverage_reporter';
import NotifyReporter from './reporters/notify_reporter';
import SummaryReporter from './reporters/summary_reporter';
import DefaultReporter from './reporters/default_reporter';

export type RunOptions = {|
  estimatedTime: number,
  showStatus: boolean,
|};

export default class ReporterDispatcher {
  _disabled: boolean;
  _reporters: Array<Reporter>;
  _globalConfig: GlobalConfig;

  constructor(globalConfig: GlobalConfig) {
    this._globalConfig = globalConfig;
    this._reporters = [];
    this._setupReporters();
  }

  register(reporter: Reporter): void {
    this._reporters.push(reporter);
  }

  unregister(ReporterClass: Function) {
    this._reporters = this._reporters.filter(
      reporter => !(reporter instanceof ReporterClass),
    );
  }

  async onTestResult(
    test: Test,
    testResult: TestResult,
    results: AggregatedResult,
  ) {
    for (const reporter of this._reporters) {
      reporter.onTestResult &&
        (await reporter.onTestResult(test, testResult, results));
    }
  }

  async onTestStart(test: Test) {
    for (const reporter of this._reporters) {
      reporter.onTestStart && (await reporter.onTestStart(test));
    }
  }

  async onRunStart(results: AggregatedResult, options: ReporterOnStartOptions) {
    for (const reporter of this._reporters) {
      reporter.onRunStart && (await reporter.onRunStart(results, options));
    }
  }

  async onRunComplete(contexts: Set<Context>, results: AggregatedResult) {
    for (const reporter of this._reporters) {
      reporter.onRunComplete &&
        (await reporter.onRunComplete(contexts, results));
    }
  }

  // Return a list of last errors for every reporter
  getErrors(): Array<Error> {
    return this._reporters.reduce((list, reporter) => {
      const error = reporter.getLastError && reporter.getLastError();
      return error ? list.concat(error) : list;
    }, []);
  }

  hasErrors(): boolean {
    return this.getErrors().length !== 0;
  }

  _setupReporters() {
    const {collectCoverage, notify, reporters} = this._globalConfig;
    const isDefault = _shouldAddDefaultReporters(reporters);

    if (isDefault) {
      this._setupDefaultReporters();
    }

    if (collectCoverage) {
      this.register(new CoverageReporter(this._globalConfig));
    }

    if (notify) {
      this.register(new NotifyReporter(this._globalConfig));
    }

    if (reporters && Array.isArray(reporters)) {
      this._addCustomReporters(reporters);
    }
  }

  _setupDefaultReporters() {
    this.register(new DefaultReporter(this._globalConfig));
    this.register(new SummaryReporter(this._globalConfig));
  }

  _addCustomReporters(reporters: Array<ReporterConfig>) {
    const customReporters = reporters.filter(
      reporterConfig => reporterConfig[0] !== 'default',
    );

    customReporters.forEach((reporter, index) => {
      const {options, path} = _getReporterProps(reporter);

      try {
        // $FlowFixMe
        const Reporter = require(path);
        this.register(new Reporter(this._globalConfig, options));
      } catch (error) {
        throw new Error(
          'An error occurred while adding the reporter at path "' +
            path +
            '".' +
            error.message,
        );
      }
    });
  }
}

const _shouldAddDefaultReporters = (
  reporters?: Array<ReporterConfig>,
): boolean => {
  return (
    !reporters ||
    !!reporters.find(reporterConfig => reporterConfig[0] === 'default')
  );
};

const _getReporterProps = (
  reporter: ReporterConfig,
): {path: string, options?: Object} => {
  if (typeof reporter === 'string') {
    return {options: {}, path: reporter};
  } else if (Array.isArray(reporter)) {
    const [path, options] = reporter;
    return {options, path};
  }

  throw new Error('Reporter should be either a string or an array');
};
