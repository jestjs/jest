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

import type {Config} from 'types/Config';
const chalk = require('chalk');
const validConfig: Config = require('./validConfig');
const {deprecated, deprecateWarning} = require('./deprecated');
const ERROR_NAME = 'Jest Configuration Error';
const WARNING_NAME = 'Jest Configuration Warning';
const BULLET = chalk.bold('\u25cf ');

class ConfigurationError extends Error {
  constructor(message) {
    super();
    this.name = '';
    this.message = chalk.red.bold(BULLET + ERROR_NAME + ':') + message;
    Error.captureStackTrace(this, () => {});
  }
}

const toString = Object.prototype.toString;

const format = (value: string): string =>
  require('pretty-format')(value, {min: true});

const extractType = (stringedType: string) =>
  stringedType.split(' ')[1].slice(0, -1);

const prettyPrintType = (value: any) => extractType(toString.call(value));

const invariant = (condition: boolean, message: string) => {
  if (!condition) {
    throw new ConfigurationError(chalk.white(message));
  }
};

const unknownOptionWarning = (config: Object, option: string) => {
  /* eslint-disable max-len */
  const message = `

  Unknown option ${chalk.bold(option)} with value ${chalk.bold(format(config[option]))} was found.
  This is either a typing error or a user mistake. Fixing it will remove this message.

  ${chalk.bold('Configuration documentation:')}
  https://facebook.github.io/jest/docs/configuration.html
`;
  /* eslint-enable max-len */
  console.warn(
    chalk.yellow(chalk.bold(BULLET + WARNING_NAME + ':') + message)
  );
};

const errorMessage = (
  option: string,
  received: any,
  defaultValue: any
) => {
  return `

  Option ${chalk.bold(option)} must be of type:
    ${chalk.green(prettyPrintType(defaultValue))}
  but instead received:
    ${chalk.red(prettyPrintType(received))}

  Example:
  {
    ${chalk.bold(`"${option}"`)}: ${chalk.bold(format(defaultValue))}
  }

  ${chalk.red.bold('Configuration documentation:')}
  ${chalk.red('https://facebook.github.io/jest/docs/configuration.html')}
  `;
};

const validationCondition = (
  option: any,
  config: Config,
  validConfig: Config
) => {
  return (
    config[option] === null ||
    typeof config[option] === 'undefined' ||
    toString.call(config[option]) === toString.call(validConfig[option])
  );
};

const validate = (config: Config) => {
  for (const option in config) {
    if (hasOwnProperty.call(validConfig, option)) {
      invariant(
        validationCondition(option, config, validConfig),
        errorMessage(option, config[option], validConfig[option]),
      );
    } else if (option in deprecated) {
      deprecateWarning(config, option);
    } else {
      unknownOptionWarning(config, option);
    }
  }

  return true;
};

module.exports = validate;
