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

import type {ScrollOptions} from './lib/scrollList';

const chalk = require('chalk');
const ansiEscapes = require('ansi-escapes');
const Prompt = require('./lib/Prompt');

const usage = (entity: string) =>
  `\n${chalk.bold('Pattern Mode Usage')}\n` +
  ` ${chalk.dim('\u203A Press')} Esc ${chalk.dim('to exit pattern mode.')}\n` +
  ` ${chalk.dim('\u203A Press')} Enter ` +
  `${chalk.dim(`to apply pattern to all ${entity}.`)}\n` +
  `\n`;

const usageRows = usage('').split('\n').length;

module.exports = class PatternPrompt {
  _pipe: stream$Writable | tty$WriteStream;
  _prompt: Prompt;
  _entityName: string;
  _currentUsageRows: number;

  constructor(pipe: stream$Writable | tty$WriteStream, prompt: Prompt) {
    this._pipe = pipe;
    this._prompt = prompt;
    this._currentUsageRows = usageRows;
  }

  run(onSuccess: Function, onCancel: Function, options?: {header: string}) {
    this._pipe.write(ansiEscapes.cursorHide);
    this._pipe.write(ansiEscapes.clearScreen);

    if (options && options.header) {
      this._pipe.write(options.header + '\n');
      this._currentUsageRows = usageRows + options.header.split('\n').length;
    } else {
      this._currentUsageRows = usageRows;
    }

    this._pipe.write(usage(this._entityName));
    this._pipe.write(ansiEscapes.cursorShow);

    this._prompt.enter(this._onChange.bind(this), onSuccess, onCancel);
  }

  _onChange(pattern: string, options: ScrollOptions) {
    this._pipe.write(ansiEscapes.eraseLine);
    this._pipe.write(ansiEscapes.cursorLeft);
  }
};
