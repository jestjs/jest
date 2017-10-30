/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import type {Context} from 'types/Context';
import type {Test} from 'types/TestRunner';
import type SearchSource from './search_source';

import chalk from 'chalk';
import InputPrompt from './input_prompt';
import Prompt from './lib/Prompt';

type SearchSources = Array<{|
  context: Context,
  searchSource: SearchSource,
|}>;

const usage =
  `\n${chalk.bold('Tags Filter Usage')}\n` +
  ` ${chalk.dim('\u203A Press')} Esc ${chalk.dim('to exit filter mode.')}\n` +
  ` ${chalk.dim('\u203A Press')} Enter ` +
  `${chalk.dim(`to filter by tags.`)}\n` +
  `\n`;

export default class TestTagsPrompt extends InputPrompt {
  _searchSources: SearchSources;

  constructor(pipe: stream$Writable | tty$WriteStream, prompt: Prompt) {
    super(usage, pipe, prompt, '@tags');
    this._searchSources = [];
  }

  _getMatchedTests(tagString: string): Array<Test> {
    const tags = tagString
      .split(/,\s*/)
      .map(tag => tag.trim())
      .filter(Boolean);

    return this._searchSources.reduce((tests, {searchSource, context}) => {
      return tests.concat(searchSource.findTestsWithTags(tags).tests);
    }, []);
  }

  updateSearchSources(searchSources: SearchSources) {
    this._searchSources = searchSources;
  }
}
