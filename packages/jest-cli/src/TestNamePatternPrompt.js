/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Config} from 'types/Config';

const ansiEscapes = require('ansi-escapes');
const chalk = require('chalk');
const {getTerminalWidth} = require('./lib/terminalUtils');
const stringLength = require('string-length');
const Prompt = require('./lib/Prompt');
const formatTestNameByPattern = require('./lib/formatTestNameByPattern');

const pluralizeTest = (total: number) => total === 1 ? 'test' : 'tests';

const usage = () =>
  `\n ${chalk.bold('Pattern Mode Usage')}\n` +
  ` ${chalk.dim('\u203A Press')} Esc ${chalk.dim('to exit pattern mode.')}\n` +
  ` ${chalk.dim('\u203A Press')} Enter ` +
  `${chalk.dim('to apply pattern to all tests.')}\n` +
  `\n`;

const usageRows = usage().split('\n').length;

module.exports = (
  config: Config,
  pipe: stream$Writable | tty$WriteStream,
  prompt: Prompt,
) => {
  class TestNamePatternPrompt {
    // $FlowFixMe
    _cachedTestResults;

    constructor() {
      (this: any).onChange = this.onChange.bind(this);
    }

    run(onSuccess: Function, onCancel: Function) {
      pipe.write(ansiEscapes.cursorHide);
      pipe.write(ansiEscapes.clearScreen);
      pipe.write(usage());
      pipe.write(ansiEscapes.cursorShow);

      prompt.enter(this.onChange, onSuccess, onCancel);
    }

    onChange(pattern: string) {
      pipe.write(ansiEscapes.eraseLine);
      pipe.write(ansiEscapes.cursorLeft);
      this.printTypeahead(pattern, 10);
    }

    printTypeahead(pattern: string, max: number) {
      const matchedTests = this.getMatchedTests(pattern);

      const total = matchedTests.length;
      const results = matchedTests.slice(0, max);
      const inputText = `${chalk.dim(' pattern \u203A')} ${pattern}`;

      pipe.write(ansiEscapes.eraseDown);
      pipe.write(inputText);
      pipe.write(ansiEscapes.cursorSavePosition);

      if (pattern) {
        if (total) {
          pipe.write(`\n\n Pattern matches ${total} ${pluralizeTest(total)}`);
        } else {
          pipe.write(`\n\n Pattern matches no tests`);
        }

        pipe.write(' from cached test suites.');

        const width = getTerminalWidth();

        results.forEach(name => {
          const testName = formatTestNameByPattern(name, pattern, width - 4);

          pipe.write(`\n ${chalk.dim('\u203A')} ${testName}`);
        });

        if (total > max) {
          const more = total - max;
          pipe.write(
            // eslint-disable-next-line max-len
            `\n  ${chalk.dim(`\u203A and ${more} more ${pluralizeTest(more)}`)}`,
          );
        }
      } else {
        pipe.write(
          // eslint-disable-next-line max-len
          `\n\n ${chalk.italic.yellow('Start typing to filter by a test name regex pattern.')}`,
        );
      }

      pipe.write(ansiEscapes.cursorTo(stringLength(inputText), usageRows - 1));
      pipe.write(ansiEscapes.cursorRestorePosition);
    }

    getMatchedTests(pattern: string) {
      let regex;

      try {
        regex = new RegExp(pattern, 'i');
      } catch (e) {
        return [];
      }

      const matchedTests = [];

      this._cachedTestResults.forEach(({testResults}) => testResults.forEach(({
        title,
      }) => {
        if (regex.test(title)) {
          matchedTests.push(title);
        }
      }));

      return matchedTests;
    }

    // $FlowFixMe
    updateCachedTestResults(testResults) {
      this._cachedTestResults = testResults || [];
    }
  }

  return new TestNamePatternPrompt();
};
