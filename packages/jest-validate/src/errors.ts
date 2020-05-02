/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import getType = require('jest-get-type');
import {ERROR, ValidationError, formatPrettyObject} from './utils';
import {getValues} from './condition';
import type {ValidationOptions} from './types';

export const errorMessage = (
  option: string,
  received: unknown,
  defaultValue: unknown,
  options: ValidationOptions,
  path?: Array<string>,
): void => {
  const conditions = getValues(defaultValue);
  const validTypes: Array<string> = Array.from(
    new Set(conditions.map(getType)),
  );

  const message = `  Option ${chalk.bold(
    `"${path && path.length > 0 ? path.join('.') + '.' : ''}${option}"`,
  )} must be of type:
    ${validTypes.map(e => chalk.bold.green(e)).join(' or ')}
  but instead received:
    ${chalk.bold.red(getType(received))}

  Example:
${formatExamples(option, conditions)}`;

  const comment = options.comment;
  const name = (options.title && options.title.error) || ERROR;

  throw new ValidationError(name, message, comment);
};

function formatExamples(option: string, examples: Array<any>) {
  return examples.map(
    e => `  {
    ${chalk.bold(`"${option}"`)}: ${chalk.bold(formatPrettyObject(e))}
  }`,
  ).join(`

  or

`);
}
