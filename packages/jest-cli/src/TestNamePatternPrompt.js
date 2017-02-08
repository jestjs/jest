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
const stringLength = require('string-length');
const Prompt = require('./lib/Prompt');

const pluralizeTest = (total: number) => total === 1 ? 'test' : 'tests';

const usage = (delimiter: string = '\n') => {
  const messages = [
    `\n ${chalk.bold('Pattern Mode Usage')}`,
    ` ${chalk.dim('\u203A Press')} ESC ${chalk.dim('to exit pattern mode.')}\n`,
  ];

  return messages.filter(message => !!message).join(delimiter) + '\n';
};

const usageRows = usage().split('\n').length;

const colorize = (str: string, start: number, end: number) => (
  chalk.dim(str.slice(0, start)) +
  chalk.reset(str.slice(start, end)) +
  chalk.dim(str.slice(end))
);

const formatTestNameByPattern = (testName, pattern) => {
  let regexp;

  try {
    regexp = new RegExp(pattern, 'i');
  } catch (e) {
    return chalk.dim(testName);
  }

  const match = testName.match(regexp);

  if (!match) {
    return chalk.dim(testName);
  }

  // $FlowFixMe
  const start = match.index;
  const end = start + match[0].length;

  return colorize(testName, Math.max(start, 0), Math.max(end, end));
};

module.exports = (
  config: Config,
  pipe: stream$Writable | tty$WriteStream,
  prompt: Prompt,
) => {
  class TestNamePatternPrompt {
    cachedTestNames: Array<string>;

    constructor() {
      (this:any).onChange = this.onChange.bind(this);
    }

    run(
      onSuccess: Function,
      onCancel: Function,
    ) {
      pipe.write(ansiEscapes.cursorHide);
      pipe.write(ansiEscapes.clearScreen);
      pipe.write(usage());
      pipe.write(ansiEscapes.cursorShow);

      prompt.prompt(
        this.onChange,
        onSuccess,
        onCancel,
      );
    }

    onChange(
      pattern: string
    ) {
      pipe.write(ansiEscapes.eraseLine);
      pipe.write(ansiEscapes.cursorLeft);
      this.printTypeahead(pattern);
    }

    printTypeahead(
      pattern: string,
      max: number = 10
    ) {
      const matchedTestNames = this.getMatchedTestNames(pattern);

      const total = matchedTestNames.length;
      const results = matchedTestNames.slice(0, max);
      const inputText = `${chalk.dim(' pattern \u203A')} ${pattern}`;

      pipe.write(ansiEscapes.eraseDown);
      pipe.write(inputText);
      pipe.write(ansiEscapes.cursorSavePosition);

      if (pattern) {
        if (total) {
          pipe.write(`\n\n Pattern matches ${total} ${pluralizeTest(total)}.`);
        } else {
          pipe.write(`\n\n Pattern matches no tests.`);
        }

        results
          .map(
            testName => formatTestNameByPattern(testName, pattern)
          )
          .forEach(
            testName => pipe.write(`\n  ${chalk.dim('\u203A')} ${testName}`)
          );

        if (total > max) {
          const more = total - max;
          pipe.write(
            // eslint-disable-next-line max-len
            `\n  ${chalk.dim(`\u203A and ${more} more ${pluralizeTest(more)}`)}`,
          );
        }
      } else {
        // eslint-disable-next-line max-len
        pipe.write(`\n\n ${chalk.italic.yellow('Start typing to filter by a testname regex pattern.')}`);
      }

      pipe.write(ansiEscapes.cursorTo(stringLength(inputText), usageRows - 1));
      pipe.write(ansiEscapes.cursorRestorePosition);
    }

    getMatchedTestNames(pattern: string) {
      let regex;

      try {
        regex = new RegExp(pattern, 'i');
      } catch (e) {
        return [];
      }

      return this.cachedTestNames.filter(testName => regex.test(testName));
    }

    // $FlowFixMe
    updateCachedTestNames(testResults = []) {
      this.cachedTestNames = testResults.reduce((testNames, item) =>
        [
          ...testNames,
          ...item.testResults.map(({title: name}) => name),
        ]
      , []);
    }
  }

  return new TestNamePatternPrompt();
};
