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
const {format, ValidationError} = require('./utils');
const {getType} = require('jest-matcher-utils');

const errorMessage = (
  option: string,
  received: any,
  defaultValue: any,
  options: ValidationOptions,
) => {
  const message =
`  Option ${chalk.bold(option)} must be of type:
    ${chalk.bold.green(getType(defaultValue))}
  but instead received:
    ${chalk.bold.red(getType(received))}

  Example:
  {
    ${chalk.bold(`"${option}"`)}: ${chalk.bold(format(defaultValue))}
  }`;

  const footer = options && options.footer;
  const name = options && options.titleError;

  throw new ValidationError(name, message, footer);
};

module.exports = {
  ValidationError,
  errorMessage,
};
