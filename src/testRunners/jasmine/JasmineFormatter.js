/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const diff = require('diff');
const chalk = require('chalk');
const utils = require('../../lib/utils');

const ERROR_TITLE_COLOR = chalk.bold.underline.red;
const DIFFABLE_MATCHERS = Object.assign(Object.create(null), {
  toBe: true,
  toNotBe: true,
  toEqual: true,
  toNotEqual: true,
});

const LINEBREAK_REGEX = /[\r\n]/;

class JasmineFormatter {

  constructor(jasmine, config) {
    this._config = config;
    this._jasmine = jasmine;
  }

  formatDiffable(matcherName, isNot, actual, expected) {
    const ppActual = this.prettyPrint(actual);
    const ppExpected = this.prettyPrint(expected);
    const colorDiff = this.highlightDifferences(ppActual, ppExpected);
    matcherName = (isNot ? 'NOT ' : '') + matcherName;

    return (
      ERROR_TITLE_COLOR('Expected:') + ' ' + colorDiff.a + ' ' +
      ERROR_TITLE_COLOR(matcherName + ':') + ' ' + colorDiff.b
    );
  }

  formatMatchFailure(result) {
    let message;
    if (DIFFABLE_MATCHERS[result.matcherName]) {
      const isNot =
        'isNot' in result ? result.isNot : /not to /.test(result.message);
      message = this.formatDiffable(
        result.matcherName,
        isNot,
        result.actual,
        result.expected
      );
    } else {
      message = ERROR_TITLE_COLOR(result.message);
    }

    // error message & stack live on 'trace' field in jasmine 1.3
    const error = result.trace ? result.trace : result;
    if (error.stack) {
      message = this.formatStackTrace(error.stack, error.message, message);
    }
    return message;
  }


  formatException(stackTrace) {
    // jasmine doesn't give us access to the actual Error object, so we
    // have to regexp out the message from the stack string in order to
    // colorize the `message` value
    return utils.cleanStackTrace(stackTrace.replace(
      /(^(.|\n)*?(?=\n\s*at\s))/,
      ERROR_TITLE_COLOR('$1')
    ));
  }

  highlightDifferences(a, b) {
    let differ;
    if (a.match(LINEBREAK_REGEX) || b.match(LINEBREAK_REGEX)) {
      // `diff` uses the Myers LCS diff algorithm which runs in O(n+d^2) time
      // (where "d" is the edit distance) and can get very slow for large edit
      // distances. Mitigate the cost by switching to a lower-resolution diff
      // whenever linebreaks are involved.
      differ = diff.diffLines;
    } else {
      differ = diff.diffChars;
    }
    const changes = differ(a, b);
    const ret = {a: '', b: ''};
    for (let i = 0, il = changes.length; i < il; i++) {
      const change = changes[i];
      if (change.added) {
        ret.b += chalk.bgRed(change.value);
      } else if (change.removed) {
        ret.a += chalk.bgRed(change.value);
      } else {
        ret.a += change.value;
        ret.b += change.value;
      }
    }
    return ret;
  }

  prettyPrint(obj, indent, cycleWeakMap) {
    if (!indent) {
      indent = '';
    }

    if (typeof obj === 'object' && obj !== null) {
      if (this._jasmine.isDomNode(obj)) {
        let attrStr = '';
        Array.prototype.forEach.call(obj.attributes, attr => {
          const attrName = attr.name.trim();
          const attrValue = attr.value.trim();
          attrStr += ' ' + attrName + '="' + attrValue + '"';
        });
        return (
          'HTMLNode(<' + obj.tagName + attrStr + '>{...}</' + obj.tagName + '>)'
        );
      }

      if (!cycleWeakMap) {
        cycleWeakMap = new WeakMap();
      }

      if (cycleWeakMap.get(obj) === true) {
        return '<circular reference>';
      }
      cycleWeakMap.set(obj, true);

      const orderedKeys = Object.keys(obj).sort();
      let value;
      const keysOutput = [];
      const keyIndent = chalk.gray('|') + ' ';
      for (let i = 0; i < orderedKeys.length; i++) {
        value = obj[orderedKeys[i]];
        keysOutput.push(
          indent + keyIndent + orderedKeys[i] + ': ' +
          this.prettyPrint(value, indent + keyIndent, cycleWeakMap)
        );
      }
      return '{\n' + keysOutput.join(',\n') + '\n' + indent + '}';
    } else {
      return this._jasmine.pp(obj);
    }
  }

  formatStackTrace(stackTrace, originalMessage, formattedMessage) {
    return utils.cleanStackTrace(
      stackTrace
        .replace(originalMessage, formattedMessage)
        .replace(/^.*Error:\s*/, '')
    );
  }
}

module.exports = JasmineFormatter;
