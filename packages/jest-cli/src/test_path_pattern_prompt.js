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
import type SearchSource from './search_source';

import chalk from 'chalk';
import Prompt from './lib/Prompt';
import InputPrompt from './input_prompt';

type SearchSources = Array<{|
  context: Context,
  searchSource: SearchSource,
|}>;

const usage =
  `\n${chalk.bold('Test Path Pattern Filter')}\n` +
  ` ${chalk.dim('\u203A Press')} Esc ${chalk.dim('to exit filter mode.')}\n` +
  ` ${chalk.dim('\u203A Press')} Enter ` +
  `${chalk.dim(`to filter by a filename regex pattern.`)}\n` +
  `\n`;

export default class TestPathPatternPrompt extends InputPrompt {
  _searchSources: SearchSources;

  constructor(pipe: stream$Writable | tty$WriteStream, prompt: Prompt) {
    super(usage, pipe, prompt, 'pattern');
    this._searchSources = [];
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
