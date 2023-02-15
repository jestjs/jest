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

/* eslint-disable local/prefer-spread-eventually, local/prefer-rest-params-eventually */

import type {Reporter, RunDetails} from '../types';
import type {SpecResult} from './Spec';
import type {SuiteResult} from './Suite';

export default class ReportDispatcher implements Reporter {
  addReporter: (reporter: Reporter) => void;
  provideFallbackReporter: (reporter: Reporter) => void;
  clearReporters: () => void;

  // @ts-expect-error: confused by loop in ctor
  jasmineDone: (runDetails: RunDetails) => void;
  // @ts-expect-error: confused by loop in ctor
  jasmineStarted: (runDetails: RunDetails) => void;
  // @ts-expect-error: confused by loop in ctor
  specDone: (result: SpecResult) => void;
  // @ts-expect-error: confused by loop in ctor
  specStarted: (spec: SpecResult) => void;
  // @ts-expect-error: confused by loop in ctor
  suiteDone: (result: SuiteResult) => void;
  // @ts-expect-error: confused by loop in ctor
  suiteStarted: (result: SuiteResult) => void;

  constructor(methods: Array<keyof Reporter>) {
    const dispatchedMethods = methods || [];

    for (let i = 0; i < dispatchedMethods.length; i++) {
      const method = dispatchedMethods[i];
      this[method] = (function (m) {
        return function () {
          dispatch(m, arguments);
        };
      })(method);
    }

    let reporters: Array<Reporter> = [];
    let fallbackReporter: Reporter | null = null;

    this.addReporter = function (reporter) {
      reporters.push(reporter);
    };

    this.provideFallbackReporter = function (reporter) {
      fallbackReporter = reporter;
    };

    this.clearReporters = function () {
      reporters = [];
    };

    return this;

    function dispatch(method: keyof Reporter, args: unknown) {
      if (reporters.length === 0 && fallbackReporter !== null) {
        reporters.push(fallbackReporter);
      }
      for (let i = 0; i < reporters.length; i++) {
        const reporter = reporters[i];
        if (reporter[method]) {
          // @ts-expect-error: wrong context
          reporter[method].apply(reporter, args);
        }
      }
    }
  }
}
