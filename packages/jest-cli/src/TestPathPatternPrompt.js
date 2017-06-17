/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Context} from 'types/Context';
import type {Test} from 'types/TestRunner';
import type {ScrollOptions} from './lib/scrollList';
// eslint-disable-next-line import/default
import type SearchSource from './SearchSource';

import chalk from 'chalk';
import stringLength from 'string-length';
import scroll from './lib/scrollList';
import {getTerminalWidth} from './lib/terminalUtils';
import highlight from './lib/highlight';
import {trimAndFormatPath} from './reporters/utils';
import Prompt from './lib/Prompt';
import {
  formatTypeaheadSelection,
  printMore,
  printPatternCaret,
  printPatternMatches,
  printRestoredPatternCaret,
  printStartTyping,
  printTypeaheadItem,
} from './lib/patternModeHelpers';
import PatternPrompt from './PatternPrompt';

type SearchSources = Array<{|
  context: Context,
  searchSource: SearchSource,
|}>;

module.exports = class TestPathPatternPrompt extends PatternPrompt {
  _searchSources: SearchSources;

  constructor(pipe: stream$Writable | tty$WriteStream, prompt: Prompt) {
    super(pipe, prompt);
    this._entityName = 'filenames';
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
      printPatternMatches(total, 'file', pipe);

      const prefix = `  ${chalk.dim('\u203A')} `;
      const padding = stringLength(prefix) + 2;
      const width = getTerminalWidth();
      const {start, end, index} = scroll(total, options);

      prompt.setTypeaheadLength(total);

      matchedTests
        .slice(start, end)
        .map(({path, context}) => {
          const filePath = trimAndFormatPath(
            padding,
            context.config,
            path,
            width,
          );
          return highlight(path, filePath, pattern, context.config.rootDir);
        })
        .map((item, i) => formatTypeaheadSelection(item, i, index, prompt))
        .forEach(item => printTypeaheadItem(item, pipe));

      if (total > end) {
        printMore('file', pipe, total - end);
      }
    } else {
      printStartTyping('filename', pipe);
    }

    printRestoredPatternCaret(pattern, this._currentUsageRows, pipe);
  }

  _getMatchedTests(pattern: string): Array<Test> {
    let regex;

    try {
      regex = new RegExp(pattern, 'i');
    } catch (e) {}

    let tests = [];
    if (regex) {
      this._searchSources.forEach(({searchSource, context}) => {
        tests = tests.concat(searchSource.findMatchingTests(pattern).tests);
      });
    }

    return tests;
  }

  updateSearchSources(searchSources: SearchSources) {
    this._searchSources = searchSources;
  }
};
