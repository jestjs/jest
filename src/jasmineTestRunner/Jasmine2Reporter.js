/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var jasmineRequire = require('../../vendor/jasmine/jasmine-2.3.4.js');
var jasmine = jasmineRequire.core(jasmineRequire);
var JasmineFormatter = require('./jasmineFormatter');

function Jasmine2Reporter(config) {
  this._config = config || {};
  this._formatter = new JasmineFormatter(jasmine, config);
  this._resultsDeferred = Promise.defer();
  this._testResults = [];
  this._currentSuites = [];
}

Jasmine2Reporter.prototype.specDone = function(result) {
  this._testResults.push(this._extractSpecResults(result,
    this._currentSuites.slice(0)));
};

Jasmine2Reporter.prototype.suiteStarted = function(suite) {
  this._currentSuites.push(suite.description);
};

Jasmine2Reporter.prototype.suiteDone = function() {
  this._currentSuites.pop();
};

Jasmine2Reporter.prototype.jasmineDone = function() {
  var numFailingTests = 0;
  var numPassingTests = 0;

  this._testResults.forEach(function(testResult) {
    if (testResult.failureMessages.length > 0) {
      numFailingTests++;
    } else {
      numPassingTests++;
    }
  });

  this._resultsDeferred.resolve({
    numFailingTests: numFailingTests,
    numPassingTests: numPassingTests,
    testResults: this._testResults,
  });
};

Jasmine2Reporter.prototype.getResults = function() {
  return this._resultsDeferred.promise;
};

Jasmine2Reporter.prototype._extractSpecResults =
function(specResult, currentSuites) {
  var results = {
    title: 'it ' + specResult.description,
    ancestorTitles: currentSuites,
    failureMessages: [],
    logMessages: [], // Jasmine 2 does not have a logging interface
    numPassingAsserts: 0, // Jasmine 2 only returns an array of failed asserts.
  };

  specResult.failedExpectations.forEach(failed => {
    if (!failed.matcherName) { // exception

      results.failureMessages.push(
        this._formatter.formatException(failed.stack)
        );

    } else { // match failure

      results.failureMessages.push(
        this._formatter.formatMatchFailure(failed)
        );

    }
  });

  return results;
};

module.exports = Jasmine2Reporter;
