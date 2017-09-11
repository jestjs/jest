/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {ValidationOptions} from './types';

import chalk from 'chalk';
import getType from 'jest-get-type';
import {format, ValidationError, ERROR} from './utils';

export const errorMessage = (
  option: string,
  received: any,
  defaultValue: any,
  options: ValidationOptions,
): void => {
  const message = `  Option ${chalk.bold(`"${option}"`)} must be of type:
    ${chalk.bold.green(getType(defaultValue))}
  but instead received:
    ${chalk.bold.red(getType(received))}

  Example:
  {
    ${chalk.bold(`"${option}"`)}: ${chalk.bold(format(defaultValue))}
  }`;

  const comment = options.comment;
  const name = (options.title && options.title.error) || ERROR;

  throw new ValidationError(name, message, comment);
};
