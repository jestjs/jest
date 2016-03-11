/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const jasmine = require('../../../vendor/jasmine/jasmine-1.3.0').jasmine;
const JasmineFormatter = require('./JasmineFormatter');

class JasmineReporter extends jasmine.Reporter {

  constructor(config) {
    super();
    this._formatter = new JasmineFormatter(jasmine, config);
    this._config = config || {};
    this._resolve = null;
    this._resultsPromise = new Promise(resolve => this._resolve = resolve);
  }

  reportRunnerResults(runner) {
    const testResults = [];
    // Find the top-level suite in order to flatten test results from there
    if (runner.suites().length) {
      runner.suites().forEach(suite => {
        if (suite.parentSuite === null) {
          this._extractSuiteResults(testResults, [], suite);
        }
      });
    }
    let numFailingTests = 0;
    let numPassingTests = 0;
    const numPendingTests = 0;
    testResults.forEach(testResult => {
      if (testResult.failureMessages.length > 0) {
        numFailingTests++;
      } else {
        numPassingTests++;
      }
    });
    this._resolve({
      numFailingTests,
      numPassingTests,
      numPendingTests,
      testResults,
    });
  }

  getResults() {
    return this._resultsPromise;
  }

  _extractSuiteResults(container, ancestorTitles, suite) {
    ancestorTitles = ancestorTitles.concat([suite.description]);
    suite.specs().forEach(
      this._extractSpecResults.bind(this, container, ancestorTitles)
    );
    suite.suites().forEach(
      this._extractSuiteResults.bind(this, container, ancestorTitles)
    );
  }

  _extractSpecResults(container, ancestorTitles, spec) {
    const results = {
      title: 'it ' + spec.description,
      ancestorTitles: ancestorTitles,
      failureMessages: [],
      numPassingAsserts: 0,
    };

    spec.results().getItems().forEach(result => {
      switch (result.type) {
        case 'expect':
          if (result.passed()) {
            results.numPassingAsserts++;
          } else if (!result.matcherName && result.trace.stack) {
            results.failureMessages.push(
              this._formatter.formatException(result.trace.stack)
            );
          } else {
            results.failureMessages.push(
              this._formatter.formatMatchFailure(result)
            );
          }
          break;
        default:
          throw new Error('Unexpected jasmine spec result type: ', result.type);
      }
    });

    container.push(results);
  }
}

module.exports = JasmineReporter;
