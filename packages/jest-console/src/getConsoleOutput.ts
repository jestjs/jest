/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import {
  StackTraceConfig,
  StackTraceOptions,
  formatStackTrace,
} from 'jest-message-util';
import type {ConsoleBuffer} from './types';

export default (
  root: string,
  verbose: boolean,
  buffer: ConsoleBuffer,
  optionalStackTraceConfig?: StackTraceConfig,
): string => {
  const TITLE_INDENT = verbose ? '  ' : '    ';
  const CONSOLE_INDENT = TITLE_INDENT + '  ';

  // TODO: make sure all callers pass correct config and remove this
  const stackTraceConfig: StackTraceConfig =
    optionalStackTraceConfig != null
      ? optionalStackTraceConfig
      : {
          rootDir: root,
          testMatch: [],
        };

  return buffer.reduce((output, {type, message, origin}) => {
    message = message
      .split(/\n/)
      .map(line => CONSOLE_INDENT + line)
      .join('\n');

    let typeMessage = 'console.' + type;
    let noStackTrace = true;
    let noCodeFrame = true;

    if (type === 'warn') {
      message = chalk.yellow(message);
      typeMessage = chalk.yellow(typeMessage);
      noStackTrace = false;
      noCodeFrame = false;
    } else if (type === 'error') {
      message = chalk.red(message);
      typeMessage = chalk.red(typeMessage);
      noStackTrace = false;
      noCodeFrame = false;
    }

    const options: StackTraceOptions = {
      noCodeFrame,
      noStackTrace,
    };

    const formattedStackTrace = formatStackTrace(
      origin,
      stackTraceConfig,
      options,
    );

    return (
      output +
      TITLE_INDENT +
      chalk.dim(typeMessage) +
      '\n' +
      message +
      '\n' +
      chalk.dim(formattedStackTrace) +
      '\n'
    );
  }, '');
};
