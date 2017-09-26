/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Context} from 'types/Context';
import type {Test} from 'types/TestRunner';
import type {ScrollOptions} from './lib/scroll_list';
import type SearchSource from './search_source';

import Prompt from './lib/Prompt';
import {
  printPatternCaret,
  printRestoredPatternCaret,
} from './lib/pattern_mode_helpers';
import PatternPrompt from './pattern_prompt';

type SearchSources = Array<{|
  context: Context,
  searchSource: SearchSource,
|}>;

export default class TestPathPatternPrompt extends PatternPrompt {
  _searchSources: SearchSources;

  constructor(pipe: stream$Writable | tty$WriteStream, prompt: Prompt) {
    super(pipe, prompt);
    this._entityName = 'filenames';
  }

  _onChange(pattern: string, options: ScrollOptions) {
    super._onChange(pattern, options);
    this._printPrompt(pattern, options);
  }

  _printPrompt(pattern: string, options: ScrollOptions) {
    const pipe = this._pipe;
    printPatternCaret(pattern, pipe);
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
}
