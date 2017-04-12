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

import type {Context} from 'types/Context';
import type {Config, Path} from 'types/Config';

const ansiEscapes = require('ansi-escapes');
const chalk = require('chalk');
const {getTerminalWidth} = require('./lib/terminalUtils');
const highlight = require('./lib/highlight');
const stringLength = require('string-length');
const {trimAndFormatPath} = require('./reporters/utils');
const SearchSource = require('./SearchSource');
const Prompt = require('./lib/Prompt');

const pluralizeFile = (total: number) => total === 1 ? 'file' : 'files';

const usage = () =>
  `\n ${chalk.bold('Pattern Mode Usage')}\n` +
  ` ${chalk.dim('\u203A Press')} Esc ${chalk.dim('to exit pattern mode.')}\n` +
  ` ${chalk.dim('\u203A Press')} Enter ` +
  `${chalk.dim('to apply pattern to all filenames.')}\n` +
  `\n`;

const usageRows = usage().split('\n').length;

module.exports = class TestPathPatternPrompt {
  _config: Config;
  _pipe: stream$Writable | tty$WriteStream;
  _prompt: Prompt;
  _searchSource: SearchSource;

  constructor(
    config: Config,
    pipe: stream$Writable | tty$WriteStream,
    prompt: Prompt,
  ) {
    this._config = config;
    this._pipe = pipe;
    this._prompt = prompt;
  }

  run(onSuccess: Function, onCancel: Function) {
    this._pipe.write(ansiEscapes.cursorHide);
    this._pipe.write(ansiEscapes.clearScreen);
    this._pipe.write(usage());
    this._pipe.write(ansiEscapes.cursorShow);

    this._prompt.enter(this._onChange.bind(this), onSuccess, onCancel);
  }

  _onChange(pattern: string) {
    let regex;

    try {
      regex = new RegExp(pattern, 'i');
    } catch (e) {}

    const paths = regex
      ? this._searchSource.findMatchingTests(pattern).paths
      : [];

    this._pipe.write(ansiEscapes.eraseLine);
    this._pipe.write(ansiEscapes.cursorLeft);
    this._printTypeahead(pattern, paths, 10);
  }

  _printTypeahead(pattern: string, allResults: Array<Path>, max: number) {
    const total = allResults.length;
    const results = allResults.slice(0, max);
    const inputText = `${chalk.dim(' pattern \u203A')} ${pattern}`;

    this._pipe.write(ansiEscapes.eraseDown);
    this._pipe.write(inputText);
    this._pipe.write(ansiEscapes.cursorSavePosition);

    if (pattern) {
      if (total) {
        this._pipe.write(
          `\n\n Pattern matches ${total} ${pluralizeFile(total)}.`,
        );
      } else {
        this._pipe.write(`\n\n Pattern matches no files.`);
      }

      const width = getTerminalWidth();
      const prefix = `  ${chalk.dim('\u203A')} `;
      const padding = stringLength(prefix) + 2;

      results
        .map(rawPath => {
          const filePath = trimAndFormatPath(
            padding,
            this._config,
            rawPath,
            width,
          );
          return highlight(rawPath, filePath, pattern, this._config.rootDir);
        })
        .forEach(filePath =>
          this._pipe.write(`\n  ${chalk.dim('\u203A')} ${filePath}`));

      if (total > max) {
        const more = total - max;
        this._pipe.write(
          // eslint-disable-next-line max-len
          `\n  ${chalk.dim(`\u203A and ${more} more ${pluralizeFile(more)}`)}`,
        );
      }
    } else {
      this._pipe.write(
        // eslint-disable-next-line max-len
        `\n\n ${chalk.italic.yellow('Start typing to filter by a filename regex pattern.')}`,
      );
    }

    this._pipe.write(
      ansiEscapes.cursorTo(stringLength(inputText), usageRows - 1),
    );
    this._pipe.write(ansiEscapes.cursorRestorePosition);
  }

  updateSearchSource(context: Context) {
    this._searchSource = new SearchSource(context, this._config);
  }
};
