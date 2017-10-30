/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import type {ScrollOptions} from './lib/scroll_list';

import ansiEscapes from 'ansi-escapes';
import Prompt from './lib/Prompt';
import {printCaret, printRestoredCaret} from './lib/cli_mode_helpers';

const calculateRows = (...args) =>
  args.reduce((total, current) => total + current.split('\n').length, 0);

export default class InputPrompt {
  _currentUsageRows: number;
  _pipe: stream$Writable | tty$WriteStream;
  _prompt: Prompt;
  _promptLabel: string;
  _usage: string;

  constructor(
    usage: string,
    pipe: stream$Writable | tty$WriteStream,
    prompt: Prompt,
    promptLabel?: string,
  ) {
    this._currentUsageRows = calculateRows(usage);
    this._pipe = pipe;
    this._prompt = prompt;
    this._promptLabel = promptLabel || 'input';
    this._usage = usage;
  }

  run(onSuccess: Function, onCancel: Function, options?: {header: string}) {
    this._pipe.write(ansiEscapes.cursorHide);
    this._pipe.write(ansiEscapes.clearScreen);

    if (options && options.header) {
      this._pipe.write(options.header + '\n');
      this._currentUsageRows = calculateRows(this._usage, options.header);
    } else {
      this._currentUsageRows = calculateRows(this._usage);
    }

    this._pipe.write(this._usage);
    this._pipe.write(ansiEscapes.cursorShow);

    this._prompt.enter(this._onChange.bind(this), onSuccess, onCancel);
  }

  _onChange(value: string, options: ScrollOptions) {
    this._pipe.write(ansiEscapes.eraseLine);
    this._pipe.write(ansiEscapes.cursorLeft);

    printCaret(this._promptLabel, value, this._pipe);
    printRestoredCaret(
      this._promptLabel,
      value,
      this._currentUsageRows,
      this._pipe,
    );
  }
}
