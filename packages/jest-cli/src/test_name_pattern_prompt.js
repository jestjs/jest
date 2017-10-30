/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TestResult} from 'types/TestResult';

import chalk from 'chalk';
import Prompt from './lib/Prompt';
import InputPrompt from './input_prompt';

const usage =
  `\n${chalk.bold('Test Name Pattern Filter')}\n` +
  ` ${chalk.dim('\u203A Press')} Esc ${chalk.dim('to exit filter mode.')}\n` +
  ` ${chalk.dim('\u203A Press')} Enter ` +
  `${chalk.dim(`to filter by a test name regex pattern.`)}\n` +
  `\n`;

export default class TestNamePatternPrompt extends InputPrompt {
  _cachedTestResults: Array<TestResult>;

  constructor(pipe: stream$Writable | tty$WriteStream, prompt: Prompt) {
    super(usage, pipe, prompt, 'pattern');
    this._cachedTestResults = [];
  }

  _getMatchedTests(pattern: string) {
    let regex;

    try {
      regex = new RegExp(pattern, 'i');
    } catch (e) {
      return [];
    }

    const matchedTests = [];

    this._cachedTestResults.forEach(({testResults}) =>
      testResults.forEach(({title}) => {
        if (regex.test(title)) {
          matchedTests.push(title);
        }
      }),
    );

    return matchedTests;
  }

  updateCachedTestResults(testResults: Array<TestResult> = []) {
    this._cachedTestResults = testResults;
  }
}
