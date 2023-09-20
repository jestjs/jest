/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// This file is a heavily modified fork of Jasmine. Original license:
/*
Copyright (c) 2008-2016 Pivotal Labs

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
/* eslint-disable sort-keys, @typescript-eslint/no-empty-function */
import type {Reporter, RunDetails} from '../types';
import type {SpecResult} from './Spec';
import type {SuiteResult} from './Suite';
import type Timer from './Timer';

const noopTimer = {
  start() {},
  elapsed() {
    return 0;
  },
};

export default class JsApiReporter implements Reporter {
  started: boolean;
  finished: boolean;
  runDetails: RunDetails;
  jasmineStarted: (runDetails: RunDetails) => void;
  jasmineDone: (runDetails: RunDetails) => void;
  status: () => unknown;
  executionTime: () => unknown;

  suiteStarted: (result: SuiteResult) => void;
  suiteDone: (result: SuiteResult) => void;
  suiteResults: (index: number, length: number) => Array<SuiteResult>;
  suites: () => Record<string, SuiteResult>;

  specResults: (index: number, length: number) => Array<SpecResult>;
  specDone: (result: SpecResult) => void;
  specs: () => Array<SpecResult>;
  specStarted: (spec: SpecResult) => void;

  constructor(options: {timer?: Timer}) {
    const timer = options.timer || noopTimer;
    let status = 'loaded';

    this.started = false;
    this.finished = false;
    this.runDetails = {};

    this.jasmineStarted = () => {
      this.started = true;
      status = 'started';
      timer.start();
    };

    let executionTime: number;

    function validateAfterAllExceptions({failedExpectations}: RunDetails) {
      if (failedExpectations && failedExpectations.length > 0) {
        throw failedExpectations[0];
      }
    }

    this.jasmineDone = function (runDetails) {
      validateAfterAllExceptions(runDetails);
      this.finished = true;
      this.runDetails = runDetails;
      executionTime = timer.elapsed();
      status = 'done';
    };

    this.status = function () {
      return status;
    };

    const suites: Array<SuiteResult> = [];
    const suites_hash: Record<string, SuiteResult> = {};

    this.specStarted = function () {};

    this.suiteStarted = function (result: SuiteResult) {
      suites_hash[result.id] = result;
    };

    this.suiteDone = function (result: SuiteResult) {
      storeSuite(result);
    };

    this.suiteResults = function (index, length) {
      return suites.slice(index, index + length);
    };

    function storeSuite(result: SuiteResult) {
      suites.push(result);
      suites_hash[result.id] = result;
    }

    this.suites = function () {
      return suites_hash;
    };

    const specs: Array<SpecResult> = [];

    this.specDone = function (result) {
      specs.push(result);
    };

    this.specResults = function (index, length) {
      return specs.slice(index, index + length);
    };

    this.specs = function () {
      return specs;
    };

    this.executionTime = function () {
      return executionTime;
    };
  }
}
