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

import type {DefaultConfig} from 'types/Config';
const chalk = require('chalk');
const DEFAULT_CONFIG_VALUES = require('./defaults');
const BULLET = chalk.bold('\u25cf ');
const DEPRECATION_MESSAGE = `

  Jest changed the default configuration for tests.

  ${chalk.bold('Configuration Documentation:')} https://facebook.github.io/jest/docs/configuration.html
  ${chalk.bold('Jest Issue Tracker:')} https://github.com/facebook/jest/issues
`;

const toString = Object.prototype.toString;

const invariant = (condition, message) => {
  if (!condition) {
    throw new Error('Jest configuration: ' + message);
  }
};

const defaultMessage = (option, expected, received) => `
  Option ${chalk.bold(option)} must be:
  ${chalk.green(expected)}
  but instead received:
  ${chalk.red(received)}

  Example:
  "${option}": "${DEFAULT_CONFIG_VALUES[option].toString()}"
`;
//
// const withDeprecation = fn => message => fn(message + DEPRECATION_MESSAGE);
//
// const throwConfigurationError = message => {
//   throw new Error(chalk.red(message));
// };
//
// const logConfigurationWarning = message => {
//   console.warn(chalk.yellow(BULLET + message));
// };

const validate = (config: DefaultConfig) => {
  switch (config) {
    case 'automock':
      invariant(
        toString.call(config.automock) === '[object Boolean]',
        defaultMessage('automock', 'Boolean', toString.call(config.automock)),
      );
      break;
  }
};

module.exports = validate;
