/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var colors = require('../lib/colors');

var diff = require('diff');
var formatMsg = require('../lib/utils').formatMsg;
var jasmineRequire = require('../../vendor/jasmine/jasmine-2.2.0');
var jasmine = jasmineRequire.core(jasmineRequire);
var Q = require('q');

var ERROR_TITLE_COLOR = colors.RED + colors.BOLD + colors.UNDERLINE;
var DIFFABLE_MATCHERS = {
  toBe: true,
  toNotBe: true,
  toEqual: true,
  toNotEqual: true
};
var LINEBREAK_REGEX = /[\r\n]/;

function JasmineReporter(config) {
  this._config = config || {};
  this._resultsDeferred = Q.defer();
  this._testResults = [];
  this._currentSuites = [];
}

JasmineReporter.prototype.specDone = function(result) {
  this._testResults.push(this._extractSpecResults(result,
    this._currentSuites.slice(0)));
};

JasmineReporter.prototype.suiteStarted = function(suite) {
  this._currentSuites.push(suite.description);
};

JasmineReporter.prototype.suiteDone = function() {
  this._currentSuites.pop();
};

JasmineReporter.prototype.getResults = function() {
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
    testResults: this._testResults
  });

  this._testResults = []; // I'm not sure if we really need this

  return this._resultsDeferred.promise;
};


JasmineReporter.prototype._extractSpecResults =
function(specResult, currentSuites) {
  var results = {
    title: 'it ' + specResult.description,
    ancestorTitles: currentSuites,
    failureMessages: [],
    logMessages: [], // Jasmine 2 does not have a logging interface
    numPassingAsserts: 0 // Jasmine 2 only returns an array of failed asserts.
  };

  specResult.failedExpectations.forEach(function(failed) {
    if (!failed.matcherName) {
      var errorMessage = failed.stack.replace(
        /(^.*$(?=\n\s*at))/m,
          this._formatMsg('$1', ERROR_TITLE_COLOR)
      );

      results.failureMessages.push(errorMessage);
    } else {
      var message;
      if (DIFFABLE_MATCHERS[failed.matcherName]) {
        var ppActual = this._prettyPrint(failed.actual);
        var ppExpected = this._prettyPrint(failed.expected);
        var colorDiff = this._highlightDifferences(ppActual, ppExpected);

        message =
              this._formatMsg('Expected:', ERROR_TITLE_COLOR) +
                ' ' + colorDiff.a +
                ' ' + this._formatMsg(failed.matcherName + ':',
                                        ERROR_TITLE_COLOR) +
                ' ' + colorDiff.b;
      } else {
        message = this._formatMsg(failed.message, ERROR_TITLE_COLOR);
      }

      if (failed.stack) {
        // Replace the error message with a colorized version of the error
        message = failed.stack.replace(failed.message, message);

        // Remove the 'Error: ' prefix from the stack trace
        message = message.replace(/^.*Error:\s*/, '');

        // Remove jasmine jonx from the stack trace
        message = message.split('\n').filter(function(line) {
          return !/vendor\/jasmine\//.test(line);
        }).join('\n');
      }

      results.failureMessages.push(message);
    }
  }.bind(this));

  return results;
};

JasmineReporter.prototype._highlightDifferences = function(a, b) {
  var differ;
  if (a.match(LINEBREAK_REGEX) || b.match(LINEBREAK_REGEX)) {
    // `diff` uses the Myers LCS diff algorithm which runs in O(n+d^2) time
    // (where "d" is the edit distance) and can get very slow for large edit
    // distances. Mitigate the cost by switching to a lower-resolution diff
    // whenever linebreaks are involved.
    differ = diff.diffLines;
  } else {
    differ = diff.diffChars;
  }
  var changes = differ(a, b);
  var ret = {a: '', b: ''};
  var change;
  for (var i = 0, il = changes.length; i < il; i++) {
    change = changes[i];
    if (change.added) {
      ret.b += this._formatMsg(change.value, colors.RED_BG);
    } else if (change.removed) {
      ret.a += this._formatMsg(change.value, colors.RED_BG);
    } else {
      ret.a += change.value;
      ret.b += change.value;
    }
  }
  return ret;
};

JasmineReporter.prototype._prettyPrint = function(obj, indent, cycleWeakMap) {
  if (!indent) {
    indent = '';
  }

  if (typeof obj === 'object' && obj !== null) {
    if (jasmine.isDomNode(obj)) {
      var attrStr = '';
      Array.prototype.forEach.call(obj.attributes, function(attr) {
        var attrName = attr.nodeName.trim();
        var attrValue = attr.nodeValue.trim();
        attrStr += ' ' + attrName + '="' + attrValue + '"';
      });
      return 'HTMLNode(' +
        '<' + obj.tagName + attrStr + '>[...]</' + obj.tagName + '>' +
      ')';
    }

    /* jshint camelcase:false */
    if (!cycleWeakMap) {
      if (typeof WeakMap !== 'function') {
        throw new Error(
          'Please run node with the --harmony flag! jest requires WeakMap ' +
          'which is only available with the --harmony flag in node < v0.12'
        );
      }
      cycleWeakMap = new WeakMap();
    }

    if (cycleWeakMap.get(obj) === true) {
      return '<circular reference>';
    }
    cycleWeakMap.set(obj, true);

    var orderedKeys = Object.keys(obj).sort();
    var value;
    var keysOutput = [];
    var keyIndent = this._formatMsg('|', colors.GRAY) + ' ';
    for (var i = 0; i < orderedKeys.length; i++) {
      if (orderedKeys[i] === '__jstest_pp_cycle__') {
        continue;
      }
      value = obj[orderedKeys[i]];
      keysOutput.push(
        indent + keyIndent + orderedKeys[i] + ': ' +
        this._prettyPrint(value, indent + keyIndent, cycleWeakMap)
      );
    }
    delete obj.__jstest_pp_cycle__;
    return '{\n' + keysOutput.join(',\n') + '\n' + indent + '}';
  } else {
    return jasmine.pp(obj);
  }
};

JasmineReporter.prototype._formatMsg = function(msg, color) {
  return formatMsg(msg, color, this._config);
};

module.exports = JasmineReporter;
