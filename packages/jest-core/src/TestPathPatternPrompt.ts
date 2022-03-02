/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Context} from 'jest-runtime';
import {
  PatternPrompt,
  Prompt,
  ScrollOptions,
  printPatternCaret,
  printRestoredPatternCaret,
} from 'jest-watcher';
import type SearchSource from './SearchSource';

type SearchSources = Array<{
  context: Context;
  searchSource: SearchSource;
}>;

// TODO: Make underscored props `private`
export default class TestPathPatternPrompt extends PatternPrompt {
  _searchSources?: SearchSources;

  constructor(pipe: NodeJS.WritableStream, prompt: Prompt) {
    super(pipe, prompt);
    this._entityName = 'filenames';
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

  updateSearchSources(searchSources: SearchSources): void {
    this._searchSources = searchSources;
  }
}
