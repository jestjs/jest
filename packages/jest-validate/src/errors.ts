/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import pc = require('picocolors');
import {getType} from 'jest-get-type';
import {getValues} from './condition';
import type {ValidationOptions} from './types';
import {ERROR, ValidationError, formatPrettyObject} from './utils';

export const errorMessage = (
  option: string,
  received: unknown,
  defaultValue: unknown,
  options: ValidationOptions,
  path?: Array<string>,
): void => {
  const conditions = getValues(defaultValue);
  const validTypes: Array<string> = [...new Set(conditions.map(getType))];

  const message = `  Option ${pc.bold(
    `"${path && path.length > 0 ? `${path.join('.')}.` : ''}${option}"`,
  )} must be of type:
    ${validTypes.map(e => pc.bold(pc.green(e))).join(' or ')}
  but instead received:
    ${pc.bold(pc.red(getType(received)))}

  Example:
${formatExamples(option, conditions)}`;

  const comment = options.comment;
  const name = (options.title && options.title.error) || ERROR;

  throw new ValidationError(name, message, comment);
};

function formatExamples(option: string, examples: Array<unknown>) {
  return examples.map(
    e => `  {
    ${pc.bold(`"${option}"`)}: ${pc.bold(formatPrettyObject(e))}
  }`,
  ).join(`

  or

`);
}
