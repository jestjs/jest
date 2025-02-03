/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pc from 'picocolors';
import type {Config} from '@jest/types';
import {
  type StackTraceConfig,
  type StackTraceOptions,
  formatStackTrace,
} from 'jest-message-util';
import type {ConsoleBuffer} from './types';

export default function getConsoleOutput(
  buffer: ConsoleBuffer,
  config: StackTraceConfig,
  globalConfig: Config.GlobalConfig,
): string {
  const TITLE_INDENT =
    globalConfig.verbose === true ? ' '.repeat(2) : ' '.repeat(4);
  const CONSOLE_INDENT = TITLE_INDENT + ' '.repeat(2);

  const logEntries = buffer.reduce((output, {type, message, origin}) => {
    message = message
      .split(/\n/)
      .map(line => CONSOLE_INDENT + line)
      .join('\n');

    let typeMessage = `console.${type}`;
    let noStackTrace = true;
    let noCodeFrame = true;

    if (type === 'warn') {
      message = pc.yellow(message);
      typeMessage = pc.yellow(typeMessage);
      noStackTrace = globalConfig?.noStackTrace ?? false;
      noCodeFrame = false;
    } else if (type === 'error') {
      message = pc.red(message);
      typeMessage = pc.red(typeMessage);
      noStackTrace = globalConfig?.noStackTrace ?? false;
      noCodeFrame = false;
    }

    const options: StackTraceOptions = {
      noCodeFrame,
      noStackTrace,
    };

    const formattedStackTrace = formatStackTrace(origin, config, options);

    return `${
      output + TITLE_INDENT + pc.dim(typeMessage)
    }\n${message.trimEnd()}\n${pc.dim(formattedStackTrace.trimEnd())}\n\n`;
  }, '');

  return `${logEntries.trimEnd()}\n`;
}
