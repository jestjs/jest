/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ConsoleBuffer,
  LogMessage,
  LogType,
  LogCounters,
  LogTimers,
} from 'types/Console';

import assert from 'assert';
import {Console} from 'console';
import {format} from 'util';
import chalk from 'chalk';
import callsites from 'callsites';

export default class BufferedConsole extends Console {
  _buffer: ConsoleBuffer;
  _counters: LogCounters;
  _timers: LogTimers;
  _groupDepth: number;

  constructor() {
    const buffer = [];
    super({write: message => BufferedConsole.write(buffer, 'log', message)});
    this._buffer = buffer;
    this._counters = {};
    this._timers = {};
    this._groupDepth = 0;
  }

  static write(
    buffer: ConsoleBuffer,
    type: LogType,
    message: LogMessage,
    level: ?number,
  ) {
    const call = callsites()[level != null ? level : 2];
    const origin = call.getFileName() + ':' + call.getLineNumber();

    buffer.push({
      message,
      origin,
      type,
    });

    return buffer;
  }

  _log(type: LogType, message: LogMessage) {
    BufferedConsole.write(
      this._buffer,
      type,
      '  '.repeat(this._groupDepth) + message,
      3,
    );
  }

  assert(...args: Array<any>) {
    try {
      assert(...args);
    } catch (error) {
      this._log('assert', error.toString());
    }
  }

  count(label: string = 'default') {
    if (!this._counters[label]) {
      this._counters[label] = 0;
    }

    this._log('count', format(`${label}: ${++this._counters[label]}`));
  }

  countReset(label: string = 'default') {
    this._counters[label] = 0;
  }

  debug(...args: Array<any>) {
    this._log('debug', format(...args));
  }

  dir(...args: Array<any>) {
    this._log('dir', format(...args));
  }

  dirxml(...args: Array<any>) {
    this._log('dirxml', format(...args));
  }

  error(...args: Array<any>) {
    this._log('error', format(...args));
  }

  group(...args: Array<any>) {
    this._groupDepth++;

    if (args.length > 0) {
      this._log('group', chalk.bold(format(...args)));
    }
  }

  groupCollapsed(...args: Array<any>) {
    this._groupDepth++;

    if (args.length > 0) {
      this._log('groupCollapsed', chalk.bold(format(...args)));
    }
  }

  groupEnd() {
    if (this._groupDepth > 0) {
      this._groupDepth--;
    }
  }

  info(...args: Array<any>) {
    this._log('info', format(...args));
  }

  log(...args: Array<any>) {
    this._log('log', format(...args));
  }

  time(label: string = 'default') {
    if (this._timers[label]) {
      return;
    }

    this._timers[label] = new Date();
  }

  timeEnd(label: string = 'default') {
    const startTime = this._timers[label];

    if (startTime) {
      const endTime = new Date();
      const time = (endTime - startTime) / 1000;
      this._log('time', format(`${label}: ${time}ms`));
      delete this._timers[label];
    }
  }

  warn(...args: Array<any>) {
    this._log('warn', format(...args));
  }

  getBuffer() {
    return this._buffer;
  }
}
