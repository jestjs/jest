/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {ValidationOptions} from './types';
import {
  WARNING,
  createDidYouMeanMessage,
  format,
  logValidationWarning,
} from './utils';

export const unknownOptionWarning = (
  config: Record<string, unknown>,
  exampleConfig: Record<string, unknown>,
  option: string,
  options: ValidationOptions,
  path?: Array<string>,
): void => {
  const didYouMean = createDidYouMeanMessage(
    option,
    Object.keys(exampleConfig),
  );
  const message = `  Unknown option ${chalk.bold(
    `"${path && path.length > 0 ? `${path.join('.')}.` : ''}${option}"`,
  )} with value ${chalk.bold(format(config[option]))} was found.${
    didYouMean && ` ${didYouMean}`
  }\n  This is probably a typing mistake. Fixing it will remove this message.`;

  const comment = options.comment;
  const name = (options.title && options.title.warning) || WARNING;

  logValidationWarning(name, message, comment);
};
