/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  PatternPrompt,
  Prompt,
  ScrollOptions,
  printPatternCaret,
  printRestoredPatternCaret,
} from 'jest-watcher';
import type {TestResult} from '@jest/test-result';

// TODO: Make underscored props `private`
export default class TestNamePatternPrompt extends PatternPrompt {
  _cachedTestResults: Array<TestResult>;

  constructor(pipe: NodeJS.WritableStream, prompt: Prompt) {
    super(pipe, prompt);
    this._entityName = 'tests';
    this._cachedTestResults = [];
  }

  _onChange(pattern: string, options: ScrollOptions): void {
    super._onChange(pattern, options);
    this._printPrompt(pattern);
  }

  _printPrompt(pattern: string): void {
    const pipe = this._pipe;
    printPatternCaret(pattern, pipe);
    printRestoredPatternCaret(pattern, this._currentUsageRows, pipe);
  }

  _getMatchedTests(pattern: string): Array<string> {
    let regex: RegExp;

    try {
      regex = new RegExp(pattern, 'i');
    } catch (e) {
      return [];
    }

    const matchedTests: Array<string> = [];

    this._cachedTestResults.forEach(({testResults}) =>
      testResults.forEach(({title}) => {
        if (regex.test(title)) {
          matchedTests.push(title);
        }
      }),
    );

    return matchedTests;
  }

  updateCachedTestResults(testResults: Array<TestResult> = []): void {
    this._cachedTestResults = testResults;
  }
}
