/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import stringLength = require('string-length');
import {ansiEscapes} from 'jest-util';

export function printPatternCaret(
  pattern: string,
  pipe: NodeJS.WritableStream,
): void {
  const inputText = `${chalk.dim(' pattern \u203A')} ${pattern}`;

  pipe.write(ansiEscapes.eraseScreenDown);
  pipe.write(inputText);
  pipe.write(ansiEscapes.saveCursorPosition);
}

export function printRestoredPatternCaret(
  pattern: string,
  currentUsageRows: number,
  pipe: NodeJS.WritableStream,
): void {
  const inputText = `${chalk.dim(' pattern \u203A')} ${pattern}`;

  pipe.write(
    ansiEscapes.cursorTo(currentUsageRows, stringLength(inputText) + 1),
  );
  pipe.write(ansiEscapes.restoreCursorPosition);
}
