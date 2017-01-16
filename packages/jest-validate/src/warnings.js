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
const {format, logValidationWarning, WARNING} = require('./utils');

const unknownOptionWarning = (
  config: Object,
  option: string,
  options: ValidationOptions
): void => {
  /* eslint-disable max-len */
  const message =
`  Unknown option ${chalk.bold(option)} with value ${chalk.bold(format(config[option]))} was found.
  This is either a typing error or a user mistake. Fixing it will remove this message.`;
  /* eslint-enable max-len */

  const comment = options.comment;
  const name = options.title && options.title.warning || WARNING;

  logValidationWarning(name, message, comment);
};

module.exports = {
  unknownOptionWarning,
};
