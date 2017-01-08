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

import type {ValidationOptions} from './types';

const chalk = require('chalk');
const {format, prettyPrintType} = require('./utils');
const BULLET: string = chalk.bold('\u25cf ');
const JEST = 'Jest';
const ERROR = 'Validation Error';
const DOCUMENTATION_NOTE = `

  ${chalk.bold('Configuration documentation:')}
  https://facebook.github.io/jest/docs/configuration.html
`;

class ValidationError extends Error {
  constructor(name: ?string, message: string) {
    super();
    this.name = '';
    this.message = chalk.red.bold(
      `${BULLET}${name || JEST} ${ERROR}:`
    ) + message;
    Error.captureStackTrace(this, () => {});
  }
}

const errorMessage = (
  option: string,
  received: any,
  defaultValue: any,
  options: ?ValidationOptions,
) => {
  const message = `

  Option ${chalk.bold(option)} must be of type:
    ${chalk.green(prettyPrintType(defaultValue))}
  but instead received:
    ${chalk.red(prettyPrintType(received))}

  Example:
  {
    ${chalk.bold(`"${option}"`)}: ${chalk.bold(format(defaultValue))}
  }`;

  throw new ValidationError(
    options && options.namespace,
    options && options.footer
    ? chalk.white(message) + chalk.red(options.footer)
    : chalk.white(message) + chalk.red(DOCUMENTATION_NOTE)
  );
};

module.exports = {
  errorMessage,
};
