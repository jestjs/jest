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
const validConfig = require('./validConfig');
const BULLET = chalk.bold('\u25cf ');

class ConfigurationError extends Error {
  constructor(message) {
    super();
    this.name = chalk.red.bold('Jest Configuration Error');
    this.message = message;
    Error.captureStackTrace(this, () => {});
  }
}

const toString = Object.prototype.toString;

const extractType = (stringedType: string) =>
  stringedType.split(' ')[1].slice(0, -1);

const prettyPrintType = (value: any) => extractType(toString.call(value));

const invariant = (condition: boolean, message: string) => {
  if (!condition) {
    throw new ConfigurationError(chalk.white(message));
  }
};

const unknownOptionWarning = (config: Object, option: string) => {
  const prettyFormat = require('pretty-format');
  const message = `
  Unknown option ${chalk.bold(option)} with value ${chalk.bold(prettyFormat(config[option], {min:true}))} was found.
  This is either a typing error or a user mistake. Fixing it will remove this message.

  ${chalk.bold('Configuration documentation:')}
  https://facebook.github.io/jest/docs/configuration.html
`;
  console.warn(chalk.yellow(chalk.bold('Jest Configuration Warning: \n') + message));
}

const errorMessage = (
  option: string,
  received: any,
  defaultValue: any
) => {
  // lazy load prettyFormat not to slow boot time when not necessary
  const prettyFormat = require('pretty-format');
  return `

  Option ${chalk.bold(option)} must be of type:
    ${chalk.green(prettyPrintType(defaultValue))}
  but instead received:
    ${chalk.red(prettyPrintType(received))}

  Example:
  {
    ${chalk.bold(`"${option}"`)}: ${chalk.bold(prettyFormat(defaultValue, {min: true}))}
  }

  ${chalk.red.bold('Configuration documentation:')}
  ${chalk.red('https://facebook.github.io/jest/docs/configuration.html')}
  `
};

const validate = (config: DefaultConfig) => {
  for (const option in config) {
    if (hasOwnProperty.call(validConfig, option)) {
      invariant(
        config[option] === null || typeof config[option] === 'undefined' || toString.call(config[option]) === toString.call(validConfig[option]),
        errorMessage(option, config[option], validConfig[option]),
      );
    } else {
      unknownOptionWarning(config, option);
    }
  }

  return true;
};

module.exports = validate;
