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
const {format} = require('./utils');
const JEST = 'Jest';
const WARNING = 'Validation Warning';
const BULLET = chalk.bold('\u25cf ');
const DOCUMENTATION_NOTE = `

  ${chalk.bold('Configuration documentation:')}
  https://facebook.github.io/jest/docs/configuration.html
`;

const unknownOptionWarning = (
  config: Object,
  option: string,
  options: ?ValidationOptions
) => {
  /* eslint-disable max-len */
  const message = `

  Unknown option ${chalk.bold(option)} with value ${chalk.bold(format(config[option]))} was found.
  This is either a typing error or a user mistake. Fixing it will remove this message.`;
  /* eslint-enable max-len */

  const footer = options && options.footer
    ? options.footer
    : DOCUMENTATION_NOTE;

  console.warn(
    chalk.yellow(
      options && options.namespace
      ? chalk.bold(BULLET + options.namespace + ' ' + WARNING + ':') + message +
        footer
      : chalk.bold(BULLET + JEST + ' ' + WARNING + ':') + message + footer
    )
  );
};

module.exports = {
  unknownOptionWarning,
};
