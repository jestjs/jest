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

import type {RunnerContext} from 'types/Reporters';
import type {HasteFS} from 'types/HasteMap';
import type {Config, Path} from 'types/Config';
import type {TestResult, AggregatedResult} from 'types/TestResult';

export type RunOptions = {
  estimatedTime: number,
  showStatus: boolean,
};

class ReporterDispatcher {
  _disabled: boolean;
  _reporters: Array<Object>;
  _runnerContext: RunnerContext;
  _requiredMethods: Array<string>;

  constructor(hasteFS: HasteFS, getTestSummary: () => string) {
    this._runnerContext = {getTestSummary, hasteFS};
    this._reporters = [];
  }

  register(reporter: Object): void {
    this._reporters.push(reporter);
  }

  unregister(ReporterClass: Function): void {
    this._reporters = this._reporters.filter(
      reporter => !(reporter instanceof ReporterClass),
    );
  }

  onTestResult(
    config: Config,
    testResult: TestResult,
    results: AggregatedResult,
  ) {
    this._callReporterMethod('onTestResult', [
      config,
      testResult,
      results,
      this._runnerContext,
    ]);
  }

  onTestStart(config: Config, path: Path) {
    this._callReporterMethod('onTestStart', [
      config,
      path,
      this._runnerContext,
    ]);
  }

  onRunStart(config: Config, results: AggregatedResult, options: RunOptions) {
    this._callReporterMethod('onRunStart', [
      config,
      results,
      this._runnerContext,
      options,
    ]);
  }

  onRunComplete(config: Config, results: AggregatedResult) {
    this._callReporterMethod('onRunComplete', [
      config,
      results,
      this._runnerContext,
    ]);
  }

  /**
   * Helper mehtod to call only the methods that exist
   * on a given reporter
   *
   * @private
   * @param {string} method name of the mehtod to be called
   * @param {Array<any>} reporterArgs arguments passed in to call the reporter
   */
  _callReporterMethod(method: string, reporterArgs: Array<any>) {
    this._reporters.forEach(reporter => {
      if (reporter[method]) {
        reporter[method].apply(reporter, reporterArgs);
      }
    });
  }

  // Return a list of last errors for every reporter
  getErrors(): Array<Error> {
    return this._reporters.reduce(
      (list, reporter) => {
        const error = reporter.getLastError && reporter.getLastError();
        return error ? list.concat(error) : list;
      },
      [],
    );
  }

  hasErrors(): boolean {
    return this.getErrors().length !== 0;
  }
}

module.exports = ReporterDispatcher;
