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

import type {Config, Path} from 'types/Config';

const {formatTestPath} = require('./reporters/utils')
const ansiEscapes = require('ansi-escapes');
const chalk = require('chalk');

const getMatchingFilesText = (total: number) => {
  const files = total === 1 ? 'file' : 'files';
  return `Pattern matches ${total} ${files}...`;
}

const printTypeahead = (
  config: Config,
  pipe: stream$Writable | tty$WriteStream,
  pattern: string,
  allResults: Array<Path>,
  max: number = 10) => {
  const total = allResults.length;
  const results = allResults.slice(0, max);
  pipe.write(ansiEscapes.eraseDown);
  pipe.write(`${chalk.dim(' pattern \u203A')} ${pattern}`);
  pipe.write(ansiEscapes.cursorSavePosition);
  if (pattern) {
    pipe.write(`\n${getMatchingFilesText(total)}`);
    results.forEach(path => {
      pipe.write(chalk.dim(`\n \u203A ${formatTestPath(config, path)}`));
    });
    if (total > max) {
      pipe.write(`\n\u203A + ${total - max} more files`);
    }
  }
  pipe.write(ansiEscapes.eraseDown);
  pipe.write(ansiEscapes.cursorRestorePosition);
};

module.exports = printTypeahead;
