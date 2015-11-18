/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const jasmineRequire = require('../../../vendor/jasmine/jasmine-2.3.4.js');
const jasmine = jasmineRequire.core(jasmineRequire);
const JasmineFormatter = require('./JasmineFormatter');

class Jasmine2Reporter {

  constructor(config) {
    this._config = config || {};
    this._formatter = new JasmineFormatter(jasmine, config);
    this._testResults = [];
    this._currentSuites = [];
    this._resolve = null;
    this._resultsPromise = new Promise(resolve => this._resolve = resolve);
  }

  specDone(result) {
    this._testResults.push(
      this._extractSpecResults(result, this._currentSuites.slice(0))
    );
  }

  suiteStarted(suite) {
    this._currentSuites.push(suite.description);
  }

  suiteDone() {
    this._currentSuites.pop();
  }

  jasmineDone() {
    let numFailingTests = 0;
    let numPassingTests = 0;
    const testResults = this._testResults;
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
      testResults,
    });
  }

  getResults() {
    return this._resultsPromise;
  }

  _extractSpecResults(specResult, currentSuites) {
    const results = {
      title: 'it ' + specResult.description,
      ancestorTitles: currentSuites,
      failureMessages: [],
      numPassingAsserts: 0, // Jasmine2 only returns an array of failed asserts.
    };

    specResult.failedExpectations.forEach(failed => {
      let message;
      if (!failed.matcherName) {
        message = this._formatter.formatException(failed.stack);
      } else {
        message = this._formatter.formatMatchFailure(failed);
      }
      results.failureMessages.push(message);
    });

    return results;
  }
}

module.exports = Jasmine2Reporter;
