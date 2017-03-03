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

import type {HasteContext} from 'types/HasteMap';
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

module.exports = (
  config: Config,
  pipe: stream$Writable | tty$WriteStream,
  prompt: Prompt,
) => {
  class TestPathPatternPrompt {
    searchSource: SearchSource;

    constructor() {
      (this: any).onChange = this.onChange.bind(this);
    }

    run(onSuccess: Function, onCancel: Function) {
      pipe.write(ansiEscapes.cursorHide);
      pipe.write(ansiEscapes.clearScreen);
      pipe.write(usage());
      pipe.write(ansiEscapes.cursorShow);

      prompt.enter(this.onChange, onSuccess, onCancel);
    }

    onChange(pattern: string) {
      let regex;

      try {
        regex = new RegExp(pattern, 'i');
      } catch (e) {}

      const paths = regex
        ? this.searchSource.findMatchingTests(pattern).paths
        : [];

      pipe.write(ansiEscapes.eraseLine);
      pipe.write(ansiEscapes.cursorLeft);
      this.printTypeahead(pattern, paths, 10);
    }

    printTypeahead(pattern: string, allResults: Array<Path>, max: number) {
      const total = allResults.length;
      const results = allResults.slice(0, max);
      const inputText = `${chalk.dim(' pattern \u203A')} ${pattern}`;

      pipe.write(ansiEscapes.eraseDown);
      pipe.write(inputText);
      pipe.write(ansiEscapes.cursorSavePosition);

      if (pattern) {
        if (total) {
          pipe.write(`\n\n Pattern matches ${total} ${pluralizeFile(total)}.`);
        } else {
          pipe.write(`\n\n Pattern matches no files.`);
        }

        const width = getTerminalWidth();
        const prefix = `  ${chalk.dim('\u203A')} `;
        const padding = stringLength(prefix) + 2;

        results
          .map(rawPath => {
            const filePath = trimAndFormatPath(padding, config, rawPath, width);
            return highlight(rawPath, filePath, pattern, config.rootDir);
          })
          .forEach(filePath =>
            pipe.write(`\n  ${chalk.dim('\u203A')} ${filePath}`));

        if (total > max) {
          const more = total - max;
          pipe.write(
            // eslint-disable-next-line max-len
            `\n  ${chalk.dim(`\u203A and ${more} more ${pluralizeFile(more)}`)}`,
          );
        }
      } else {
        // eslint-disable-next-line max-len
        pipe.write(
          `\n\n ${chalk.italic.yellow('Start typing to filter by a filename regex pattern.')}`,
        );
      }

      pipe.write(ansiEscapes.cursorTo(stringLength(inputText), usageRows - 1));
      pipe.write(ansiEscapes.cursorRestorePosition);
    }

    updateSearchSource(hasteContext: HasteContext) {
      this.searchSource = new SearchSource(hasteContext, config);
    }
  }

  return new TestPathPatternPrompt();
};
