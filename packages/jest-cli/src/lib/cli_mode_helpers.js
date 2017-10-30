/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import chalk from 'chalk';
import ansiEscapes from 'ansi-escapes';
import stringLength from 'string-length';

export const printCaret = (
  name: string,
  value: string,
  pipe: stream$Writable | tty$WriteStream,
) => {
  const prompt = ` ${name} \u203A`;
  const inputText = `${chalk.dim(prompt)} ${value}`;

  pipe.write(ansiEscapes.eraseDown);
  pipe.write(inputText);
  pipe.write(ansiEscapes.cursorSavePosition);
};

export const printRestoredCaret = (
  name: string,
  value: string,
  currentUsageRows: number,
  pipe: stream$Writable | tty$WriteStream,
) => {
  const prompt = ` ${name} \u203A`;
  const inputText = `${chalk.dim(prompt)} ${value}`;

  pipe.write(
    ansiEscapes.cursorTo(stringLength(inputText), currentUsageRows - 1),
  );
  pipe.write(ansiEscapes.cursorRestorePosition);
};
