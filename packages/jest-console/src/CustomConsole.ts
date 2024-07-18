/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AssertionError, strict as assert} from 'assert';
import {Console} from 'console';
import type {WriteStream} from 'tty';
import {type InspectOptions, format, formatWithOptions, inspect} from 'util';
import * as pico from 'picocolors';
import {clearLine, formatTime} from 'jest-util';
import type {LogCounters, LogMessage, LogTimers, LogType} from './types';

type Formatter = (type: LogType, message: LogMessage) => string;

export default class CustomConsole extends Console {
  private readonly _stdout: WriteStream;
  private readonly _stderr: WriteStream;
  private readonly _formatBuffer: Formatter;
  private _counters: LogCounters = {};
  private _timers: LogTimers = {};
  private _groupDepth = 0;

  override Console: typeof Console = Console;

  constructor(
    stdout: WriteStream,
    stderr: WriteStream,
    formatBuffer: Formatter = (_type, message) => message,
  ) {
    super(stdout, stderr);
    this._stdout = stdout;
    this._stderr = stderr;
    this._formatBuffer = formatBuffer;
  }

  private _log(type: LogType, message: string) {
    clearLine(this._stdout);
    super.log(
      this._formatBuffer(type, '  '.repeat(this._groupDepth) + message),
    );
  }

  private _logError(type: LogType, message: string) {
    clearLine(this._stderr);
    super.error(
      this._formatBuffer(type, '  '.repeat(this._groupDepth) + message),
    );
  }

  override assert(value: unknown, message?: string | Error): asserts value {
    try {
      assert(value, message);
    } catch (error) {
      if (!(error instanceof AssertionError)) {
        throw error;
      }
      // https://github.com/jestjs/jest/pull/13422#issuecomment-1273396392
      this._logError('assert', error.toString().replaceAll(/:\n\n.*\n/gs, ''));
    }
  }

  override count(label = 'default'): void {
    if (!this._counters[label]) {
      this._counters[label] = 0;
    }

    this._log('count', format(`${label}: ${++this._counters[label]}`));
  }

  override countReset(label = 'default'): void {
    this._counters[label] = 0;
  }

  override debug(firstArg: unknown, ...args: Array<unknown>): void {
    this._log('debug', format(firstArg, ...args));
  }

  override dir(firstArg: unknown, options: InspectOptions = {}): void {
    const representation = inspect(firstArg, options);
    this._log('dir', formatWithOptions(options, representation));
  }

  override dirxml(firstArg: unknown, ...args: Array<unknown>): void {
    this._log('dirxml', format(firstArg, ...args));
  }

  override error(firstArg: unknown, ...args: Array<unknown>): void {
    this._logError('error', format(firstArg, ...args));
  }

  override group(title?: string, ...args: Array<unknown>): void {
    this._groupDepth++;

    if (title != null || args.length > 0) {
      this._log('group', pico.bold(format(title, ...args)));
    }
  }

  override groupCollapsed(title?: string, ...args: Array<unknown>): void {
    this._groupDepth++;

    if (title != null || args.length > 0) {
      this._log('groupCollapsed', pico.bold(format(title, ...args)));
    }
  }

  override groupEnd(): void {
    if (this._groupDepth > 0) {
      this._groupDepth--;
    }
  }

  override info(firstArg: unknown, ...args: Array<unknown>): void {
    this._log('info', format(firstArg, ...args));
  }

  override log(firstArg: unknown, ...args: Array<unknown>): void {
    this._log('log', format(firstArg, ...args));
  }

  override time(label = 'default'): void {
    if (this._timers[label] != null) {
      return;
    }

    this._timers[label] = new Date();
  }

  override timeEnd(label = 'default'): void {
    const startTime = this._timers[label];

    if (startTime != null) {
      const endTime = Date.now();
      const time = endTime - startTime.getTime();
      this._log('time', format(`${label}: ${formatTime(time)}`));
      delete this._timers[label];
    }
  }

  override timeLog(label = 'default', ...data: Array<unknown>): void {
    const startTime = this._timers[label];

    if (startTime != null) {
      const endTime = new Date();
      const time = endTime.getTime() - startTime.getTime();
      this._log('time', format(`${label}: ${formatTime(time)}`, ...data));
    }
  }

  override warn(firstArg: unknown, ...args: Array<unknown>): void {
    this._logError('warn', format(firstArg, ...args));
  }

  getBuffer(): undefined {
    return undefined;
  }
}
