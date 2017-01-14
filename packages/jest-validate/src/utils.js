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

const chalk = require('chalk');
const BULLET: string = chalk.bold('\u25cf ');

const format = (value: string): string =>
  require('pretty-format')(value, {min: true});

class ValidationError extends Error {
  name: string;
  message: string;

  constructor(name: string, message: string, footer: ?string) {
    super();
    footer = footer ? '\n\n' + footer : '\n';
    this.name = '';
    this.message =
      chalk.red.bold(name) + ':\n\n' + message + chalk.red(footer);
    Error.captureStackTrace(this, () => {});
  }
}

function logValidationWarning(name: string, message: string, footer?: ?string) {
  footer = footer ? '\n\n' + footer : '\n';
  console.warn(chalk.yellow(chalk.bold(name) + ':\n\n' + message + footer));
}

module.exports = {
  BULLET,
  ValidationError,
  format,
  logValidationWarning,
};
