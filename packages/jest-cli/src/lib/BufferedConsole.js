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

import type {ConsoleBuffer, LogMessage, LogType} from 'types/Console';

const {Console} = require('console');

const {format} = require('util');
const callsites = require('callsites');

class BufferedConsole extends Console {
  _buffer: ConsoleBuffer;

  constructor() {
    const buffer = [];
    super({write: message => BufferedConsole.write(buffer, 'log', message)});
    this._buffer = buffer;
  }

  static write(
    buffer: ConsoleBuffer,
    type: LogType,
    message: LogMessage,
    level: ?number,
  ) {
    const call = callsites()[level != null ? level : 2];
    const origin = call.getFileName() + ':' + call.getLineNumber();
    buffer.push({message, origin, type});
    return buffer;
  }

  log() {
    BufferedConsole.write(this._buffer, 'log', format.apply(null, arguments));
  }

  info() {
    BufferedConsole.write(this._buffer, 'info', format.apply(null, arguments));
  }

  warn() {
    BufferedConsole.write(this._buffer, 'warn', format.apply(null, arguments));
  }

  error() {
    BufferedConsole.write(this._buffer, 'error', format.apply(null, arguments));
  }

  getBuffer() {
    return this._buffer;
  }
}

module.exports = BufferedConsole;
