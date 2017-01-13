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

const {relativePath} = require('./reporters/utils');
const ansiEscapes = require('ansi-escapes');
const chalk = require('chalk');
const highlight = require('./lib/highlight');
const path = require('path');

const pluralizeFile = (total: number) => total === 1 ? 'file' : 'files';

const printTypeahead = (
  config: Config,
  pipe: stream$Writable | tty$WriteStream,
  pattern: string,
  allResults: Array<Path>,
  max: number = 10
) => {
  const total = allResults.length;
  const results = allResults.slice(0, max);

  pipe.write(`${chalk.dim(' pattern \u203A')} ${pattern}`);
  pipe.write(ansiEscapes.cursorSavePosition);

  if (pattern) {
    if (total) {
      pipe.write(`\n\n Pattern matches ${total} ${pluralizeFile(total)}.`);
    } else {
      pipe.write(`\n\n Pattern matches no files.`);
    }
    results.forEach(filePath => {
      const {basename, dirname} = relativePath(config, filePath);
      const formattedPath = highlight(dirname + path.sep + basename, pattern);
      pipe.write(`\n  ${chalk.dim('\u203A')} ${formattedPath}`);
    });
    if (total > max) {
      const more = total - max;
      pipe.write(
        `\n  ${chalk.dim(`\u203A and ${more} more ${pluralizeFile(more)}`)}`,
      );
    }
  } else {
    // eslint-disable-next-line max-len
    pipe.write(`\n\n ${chalk.italic.yellow('Start typing to filter by a filename regex pattern.')}`);
  }

  pipe.write(ansiEscapes.cursorRestorePosition);
};

module.exports = printTypeahead;
