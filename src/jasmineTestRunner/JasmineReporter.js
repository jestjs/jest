/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var jasmine = require('../../vendor/jasmine/jasmine-1.3.0').jasmine;
var JasmineFormatter = require('./jasmineFormatter');

function JasmineReporter(config) {
  jasmine.Reporter.call(this);
  this._formatter = new JasmineFormatter(jasmine, config);
  this._config = config || {};
  this._logs = [];
  this._resultsPromise = new Promise(resolve => this._resolve = resolve);
}

JasmineReporter.prototype = Object.create(jasmine.Reporter.prototype);

// All describe() suites have finished
JasmineReporter.prototype.reportRunnerResults = function(runner) {
  var testResults = [];

  // Find the top-level suite in order to flatten test results from there
  if (runner.suites().length) {
    runner.suites().forEach(function(suite) {
      if (suite.parentSuite === null) {
        this._extractSuiteResults(testResults, [], suite);
      }
    }, this);
  }

  var numFailingTests = 0;
  var numPassingTests = 0;
  testResults.forEach(function(testResult) {
    if (testResult.failureMessages.length > 0) {
      numFailingTests++;
    } else {
      numPassingTests++;
    }
  });

  this._resolve({
    numFailingTests: numFailingTests,
    numPassingTests: numPassingTests,
    testResults: testResults,
  });
};

JasmineReporter.prototype.getResults = function() {
  return this._resultsPromise;
};

JasmineReporter.prototype.log = function(str) {
  console.log('logging: ', str);
};

JasmineReporter.prototype._extractSuiteResults =
function(container, ancestorTitles, suite) {
  ancestorTitles = ancestorTitles.concat([suite.description]);

  suite.specs().forEach(
    this._extractSpecResults.bind(this, container, ancestorTitles)
  );
  suite.suites().forEach(
    this._extractSuiteResults.bind(this, container, ancestorTitles)
  );
};

JasmineReporter.prototype._extractSpecResults =
function(container, ancestorTitles, spec) {
  var results = {
    title: 'it ' + spec.description,
    ancestorTitles: ancestorTitles,
    failureMessages: [],
    numPassingAsserts: 0,
  };

  spec.results().getItems().forEach(function(result) {
    switch (result.type) {
      case 'expect':
        if (result.passed()) {

          results.numPassingAsserts++;

        // Exception thrown
        } else if (!result.matcherName && result.trace.stack) {

          results.failureMessages.push(
            this._formatter.formatException(result.trace.stack)
            );

        // Matcher failed
        } else {

          results.failureMessages.push(
            this._formatter.formatMatchFailure(result)
            );
        }
        break;
      default:
        throw new Error(
          'Unexpected jasmine spec result type: ', result.type
        );
    }
  }, this);

  container.push(results);
};

module.exports = JasmineReporter;
