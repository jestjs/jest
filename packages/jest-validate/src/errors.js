/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ValidationOptions} from './types';

import chalk from 'chalk';
import getType from 'jest-get-type';
import {formatPrettyObject, ValidationError, ERROR} from './utils';
import {getConditions} from './condition';

export const errorMessage = (
  option: string,
  received: any,
  defaultValue: any,
  options: ValidationOptions,
  path?: Array<string>,
): void => {
  const conditions = getConditions(defaultValue);
  const validTypes = conditions
    .map(getType)
    .filter(uniqueFilter())
    .join(' or ');

  const message = `  Option ${chalk.bold(
    `"${path && path.length > 0 ? path.join('.') + '.' : ''}${option}"`,
  )} must be of type:
    ${chalk.bold.green(validTypes)}
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

function uniqueFilter() {
  const seen: {[string]: any} = {};
  return function(key) {
    if (seen[key]) {
      return false;
    }
    return (seen[key] = true);
  };
}
