/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Context} from 'jest-runtime';
import {Test} from 'jest-runner';

import {
  PatternPrompt,
  Prompt,
  ScrollOptions,
  printPatternCaret,
  printRestoredPatternCaret,
} from 'jest-watcher';
import SearchSource from './SearchSource';

type SearchSources = Array<{
  context: Context;
  searchSource: SearchSource;
}>;

export default class TestPathPatternPrompt extends PatternPrompt {
  private _searchSources: SearchSources;

  constructor(pipe: NodeJS.WritableStream, prompt: Prompt) {
    super(pipe, prompt);
    this._entityName = 'filenames';
  }

  protected _onChange(pattern: string) {
    super._onChange();
    this._printPrompt(pattern);
  }

  private _printPrompt(pattern: string) {
    const pipe = this._pipe;
    printPatternCaret(pattern, pipe);
    printRestoredPatternCaret(pattern, this._currentUsageRows, pipe);
  }

  private _getMatchedTests(pattern: string): Array<Test> {
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
