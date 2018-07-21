/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* global stream$Writable */

import type {LogType, LogMessage, LogCounters, LogTimers} from 'types/Console';

import assert from 'assert';
import {format} from 'util';
import {Console} from 'console';
import chalk from 'chalk';
import clearLine from './clear_line';

type Formatter = (type: LogType, message: LogMessage) => string;

export default class CustomConsole extends Console {
  _stdout: stream$Writable;
  _formatBuffer: Formatter;
  _counters: LogCounters;
  _timers: LogTimers;
  _groupDepth: number;

  constructor(
    stdout: stream$Writable,
    stderr: stream$Writable,
    formatBuffer: ?Formatter,
  ) {
    super(stdout, stderr);
    this._formatBuffer = formatBuffer || ((type, message) => message);
    this._counters = {};
    this._timers = {};
    this._groupDepth = 0;
  }

  _logToParentConsole(message: string) {
    super.log(message);
  }

  _log(type: LogType, message: string) {
    clearLine(this._stdout);
    this._logToParentConsole(
      this._formatBuffer(type, '  '.repeat(this._groupDepth) + message),
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
      const time = endTime - startTime;
      this._log('time', format(`${label}: ${time}ms`));
      delete this._timers[label];
    }
  }

  warn(...args: Array<any>) {
    this._log('warn', format(...args));
  }

  getBuffer() {
    return null;
  }
}
