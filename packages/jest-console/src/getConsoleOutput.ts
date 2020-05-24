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
  // TODO: remove in 27
  root: string,
  verbose: boolean,
  buffer: ConsoleBuffer,
  // TODO: make mandatory and take Config.ProjectConfig in 27
  config: StackTraceConfig = {
    rootDir: root,
    testMatch: [],
  },
  globalNoStackTrace: boolean,
): string => {
  const TITLE_INDENT = verbose ? '  ' : '    ';
  const CONSOLE_INDENT = TITLE_INDENT + '  ';

  const logEntries = buffer.reduce((output, {type, message, origin}) => {
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
      noStackTrace = false || globalNoStackTrace;
      noCodeFrame = false;
    } else if (type === 'error') {
      message = chalk.red(message);
      typeMessage = chalk.red(typeMessage);
      noStackTrace = false || globalNoStackTrace;
      noCodeFrame = false;
    }

    const options: StackTraceOptions = {
      noCodeFrame,
      noStackTrace,
    };

    const formattedStackTrace = formatStackTrace(origin, config, options);

    return (
      output +
      TITLE_INDENT +
      chalk.dim(typeMessage) +
      '\n' +
      message.trimRight() +
      '\n' +
      chalk.dim(formattedStackTrace.trimRight()) +
      '\n\n'
    );
  }, '');

  return logEntries.trimRight() + '\n';
};
