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

const ERROR_TITLE_COLOR = chalk.bold.underline.red;
const LINEBREAK_REGEX = /[\r\n]/;

class JasmineFormatter {

  constructor(jasmine, environment, config) {
    this._config = config;
    this._jasmine = jasmine;
    this._environment = environment;
    this._diffableMatchers = Object.assign(Object.create(null), {
      toBe: true,
      toNotBe: true,
      toEqual: true,
      toNotEqual: true,
    });
  }

  addDiffableMatcher(matcherName) {
    this._diffableMatchers[matcherName] = true;
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
    if (this._diffableMatchers[result.matcherName]) {
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
    if (!this._config.noStackTrace && error.stack) {
      message = error.stack
        .replace(message, error.message)
        .replace(/^.*Error:\s*/, '');
    }
    return message;
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

  prettyPrint(object, indent, cycleWeakMap) {
    if (!indent) {
      indent = '';
    }

    if (typeof object === 'object' && object !== null) {
      if (
        this._environment.global.Node &&
        object instanceof this._environment.global.Node &&
        object.nodeType > 0
      ) {
        let attrStr = '';
        if (object.attributes && object.tagName) {
          Array.from(object.attributes).forEach(attr => {
            const attrName = attr.name.trim();
            const attrValue = attr.value.trim();
            attrStr += ' ' + attrName + '="' + attrValue + '"';
          });
          return (
            `HTMLNode(<${object.tagName + attrStr}>{...}</${object.tagName}>)`
          );
        } else {
          return `HTMLNode(<${object.constructor.name} />)`;
        }
      }

      if (!cycleWeakMap) {
        cycleWeakMap = new WeakMap();
      }

      if (cycleWeakMap.get(object) === true) {
        return '<circular reference>';
      }
      cycleWeakMap.set(object, true);

      const type = Object.prototype.toString.call(object);
      const output = [];
      if (type === '[object Map]') {
        indent = chalk.gray('|') + ' ' + indent;
        for (const value of object) {
          output.push(
            indent + value[0] + ': ' + this.prettyPrint(
              value[1],
              indent,
              cycleWeakMap
            )
          );
        }
        return `Map {\n${output.join(',')}\n}`;
      }
      if (type === '[object Set]') {
        for (const value of object) {
          output.push(
            this.prettyPrint(
              value,
              chalk.gray('|') + ' ' + indent,
              cycleWeakMap
            )
          );
        }
        return `Set [\n${indent}${output.join(', ')}\n${indent}]`;
      }

      const orderedKeys = Object.keys(object).sort();
      let value;
      const keysOutput = [];
      const keyIndent = chalk.gray('|') + ' ';
      for (let i = 0; i < orderedKeys.length; i++) {
        value = object[orderedKeys[i]];
        keysOutput.push(
          indent + keyIndent + orderedKeys[i] + ': ' +
          this.prettyPrint(value, indent + keyIndent, cycleWeakMap)
        );
      }
      return '{\n' + keysOutput.join(',\n') + '\n' + indent + '}';
    } else {
      return this._jasmine.pp(object);
    }
  }

}

module.exports = JasmineFormatter;
