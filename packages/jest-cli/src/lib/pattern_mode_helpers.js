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

import chalk from 'chalk';
import ansiEscapes from 'ansi-escapes';
import stringLength from 'string-length';
import stripAnsi from 'strip-ansi';
import Prompt from './Prompt';

const pluralize = (count: number, text: string) =>
  count === 1 ? text : text + 's';

const printPatternMatches = (
  count: number,
  entity: string,
  pipe: stream$Writable | tty$WriteStream,
  extraText: string = '',
) => {
  const pluralized = pluralize(count, entity);
  const result = count
    ? `\n\n Pattern matches ${count} ${pluralized}`
    : `\n\n Pattern matches no ${pluralized}`;

  pipe.write(result + extraText);
};

const printPatternCaret = (
  pattern: string,
  pipe: stream$Writable | tty$WriteStream,
) => {
  const inputText = `${chalk.dim(' pattern \u203A')} ${pattern}`;

  pipe.write(ansiEscapes.eraseDown);
  pipe.write(inputText);
  pipe.write(ansiEscapes.cursorSavePosition);
};

const printRestoredPatternCaret = (
  pattern: string,
  currentUsageRows: number,
  pipe: stream$Writable | tty$WriteStream,
) => {
  const inputText = `${chalk.dim(' pattern \u203A')} ${pattern}`;

  pipe.write(
    ansiEscapes.cursorTo(stringLength(inputText), currentUsageRows - 1),
  );
  pipe.write(ansiEscapes.cursorRestorePosition);
};

const printStartTyping = (
  entity: string,
  pipe: stream$Writable | tty$WriteStream,
) => {
  pipe.write(
    `\n\n ${chalk.italic.yellow(
      `Start typing to filter by a ${entity} regex pattern.`,
    )}`,
  );
};

const printMore = (
  entity: string,
  pipe: stream$Writable | tty$WriteStream,
  more: number,
) => {
  pipe.write(
    `\n   ${chalk.dim(`...and ${more} more ${pluralize(more, entity)}`)}`,
  );
};

const printTypeaheadItem = (
  item: string,
  pipe: stream$Writable | tty$WriteStream,
) => pipe.write(`\n ${chalk.dim('\u203A')} ${item}`);

const formatTypeaheadSelection = (
  item: string,
  index: number,
  activeIndex: number,
  prompt: Prompt,
) => {
  if (index === activeIndex) {
    prompt.setTypheadheadSelection(stripAnsi(item));
    return chalk.black.bgYellow(stripAnsi(item));
  }
  return item;
};

module.exports = {
  formatTypeaheadSelection,
  printMore,
  printPatternCaret,
  printPatternMatches,
  printRestoredPatternCaret,
  printStartTyping,
  printTypeaheadItem,
};
