/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var diff = require('diff');
var colors = require('../lib/colors');
var formatMsg = require('../lib/utils').formatMsg;

var KEEP_TRACE_LINES = 2;
var ERROR_TITLE_COLOR = colors.RED + colors.BOLD + colors.UNDERLINE;
var DIFFABLE_MATCHERS = {
  toBe: true,
  toNotBe: true,
  toEqual: true,
  toNotEqual: true,
};
var LINEBREAK_REGEX = /[\r\n]/;

var JasmineFormatter = function(jasmine, config) {
  this._config = config;
  this._jasmine = jasmine;
};

JasmineFormatter.prototype.formatMsg = function(msg, color) {
  return formatMsg(msg, color, this._config);
};

JasmineFormatter.prototype.formatFailure = function(msg) {
  return this.formatMsg(msg, ERROR_TITLE_COLOR);
};

JasmineFormatter.prototype.formatDiffable =
function(matcherName, isNot, actual, expected) {

  var ppActual = this.prettyPrint(actual);
  var ppExpected = this.prettyPrint(expected);
  var colorDiff = this.highlightDifferences(ppActual,
                ppExpected);

  matcherName = (isNot ? 'NOT ' : '') + matcherName;

  return this.formatMsg('Expected:', ERROR_TITLE_COLOR) +
      ' ' + colorDiff.a +
      ' ' + this.formatMsg(matcherName + ':',
                                      ERROR_TITLE_COLOR) +
      ' ' + colorDiff.b;
};

JasmineFormatter.prototype.formatMatchFailure = function(result) {

  var message;
  if (DIFFABLE_MATCHERS[result.matcherName]) {

    var isNot = 'isNot' in result ?
                  result.isNot :
                  /not to /.test(result.message);

    message = this.formatDiffable(result.matcherName,
      isNot,
      result.actual,
      result.expected);

  } else {
    message = this.formatFailure(result.message);
  }

  // error message & stack live on 'trace' field in jasmine 1.3
  var error = result.trace ? result.trace : result;

  if (error.stack) {
    message = this.formatStackTrace(error.stack,
                                              error.message,
                                              message);
  }

  return message;

};


JasmineFormatter.prototype.formatException = function(stackTrace) {
  // jasmine doesn't give us access to the actual Error object, so we
  // have to regexp out the message from the stack string in order to
  // colorize the `message` value

  stackTrace = stackTrace.replace(
            /(^(.|\n)*?(?=\n\s*at\s))/,
            this.formatFailure('$1')
          );

  return this.cleanStackTrace(stackTrace);

};

JasmineFormatter.prototype.highlightDifferences = function(a, b) {
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
      ret.b += this.formatMsg(change.value, colors.RED_BG);
    } else if (change.removed) {
      ret.a += this.formatMsg(change.value, colors.RED_BG);
    } else {
      ret.a += change.value;
      ret.b += change.value;
    }
  }
  return ret;
};

JasmineFormatter.prototype.prettyPrint = function(obj, indent, cycleWeakMap) {
  if (!indent) {
    indent = '';
  }

  if (typeof obj === 'object' && obj !== null) {
    if (this._jasmine.isDomNode(obj)) {
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
    var keyIndent = this.formatMsg('|', colors.GRAY) + ' ';
    for (var i = 0; i < orderedKeys.length; i++) {
      if (orderedKeys[i] === '__jstest_pp_cycle__') {
        continue;
      }
      value = obj[orderedKeys[i]];
      keysOutput.push(
        indent + keyIndent + orderedKeys[i] + ': ' +
        this.prettyPrint(value, indent + keyIndent, cycleWeakMap)
      );
    }
    delete obj.__jstest_pp_cycle__;
    return '{\n' + keysOutput.join(',\n') + '\n' + indent + '}';
  } else {
    return this._jasmine.pp(obj);
  }

};

JasmineFormatter.prototype.cleanStackTrace = function(stackTrace) {

  // Remove jasmine jonx from the stack trace
  var lines = 0;
  var keepFirstLines = function() {
    return (lines++ < KEEP_TRACE_LINES);
  };

  return stackTrace.split('\n').filter(function(line) {

    return keepFirstLines() ||
          !/jest(-cli)?\/(vendor|src|node_modules)\//.test(line);

  }).join('\n');

};

JasmineFormatter.prototype.formatStackTrace =
function(stackTrace, originalMessage, formattedMessage) {

  // Replace the error message with a colorized version of the error
  var formatted = stackTrace.replace(originalMessage, formattedMessage);

  // Remove the 'Error: ' prefix from the stack trace
  formatted = formatted.replace(/^.*Error:\s*/, '');

  return this.cleanStackTrace(formatted);
};

module.exports = JasmineFormatter;
