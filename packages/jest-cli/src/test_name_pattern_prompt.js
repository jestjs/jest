/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {TestResult} from 'types/TestResult';
import chalk from 'chalk';
import type {ScrollOptions} from './lib/scroll_list';

import scroll from './lib/scroll_list';
import {getTerminalWidth} from './lib/terminal_utils';
import Prompt from './lib/Prompt';
import formatTestNameByPattern from './lib/format_test_name_by_pattern';
import {
  formatTypeaheadSelection,
  printMore,
  printPatternCaret,
  printPatternMatches,
  printRestoredPatternCaret,
  printStartTyping,
  printTypeaheadItem,
} from './lib/pattern_mode_helpers';
import PatternPrompt from './pattern_prompt';

export default class TestNamePatternPrompt extends PatternPrompt {
  _cachedTestResults: Array<TestResult>;

  constructor(pipe: stream$Writable | tty$WriteStream, prompt: Prompt) {
    super(pipe, prompt);
    this._entityName = 'tests';
    this._cachedTestResults = [];
  }

  _onChange(pattern: string, options: ScrollOptions) {
    super._onChange(pattern, options);
    this._printTypeahead(pattern, options);
  }

  _printTypeahead(pattern: string, options: ScrollOptions) {
    const matchedTests = this._getMatchedTests(pattern);
    const total = matchedTests.length;
    const pipe = this._pipe;
    const prompt = this._prompt;

    printPatternCaret(pattern, pipe);

    if (pattern) {
      printPatternMatches(
        total,
        'test',
        pipe,
        ` from ${chalk.yellow('cached')} test suites`,
      );

      const width = getTerminalWidth();
      const {start, end, index} = scroll(total, options);

      prompt.setTypeaheadLength(total);

      matchedTests
        .slice(start, end)
        .map(name => formatTestNameByPattern(name, pattern, width - 4))
        .map((item, i) => formatTypeaheadSelection(item, i, index, prompt))
        .forEach(item => printTypeaheadItem(item, pipe));

      if (total > end) {
        printMore('test', pipe, total - end);
      }
    } else {
      printStartTyping('test name', pipe);
    }

    printRestoredPatternCaret(pattern, this._currentUsageRows, pipe);
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
