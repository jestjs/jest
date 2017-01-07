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

const chalk = require('chalk');
const WARNING_NAME = 'Jest Deprecation Warning:\n';
const DOCUMENTATION_NOTE = `

  ${chalk.bold('Configuration documentation:')}
  https://facebook.github.io/jest/docs/configuration.html
`;
const BULLET = chalk.bold('\u25cf ');

const deprecationMessage = (message: string) => {
  console.warn(
    chalk.yellow(
      chalk.bold(BULLET + WARNING_NAME) + message + DOCUMENTATION_NOTE
    )
  );
};

/* eslint-disable max-len */
const deprecated = {
  preprocessorIgnorePatterns: (config: Object) => `
  Option ${chalk.bold('preprocessorIgnorePatterns')} was replaced by ${chalk.bold('transformIgnorePatterns')}, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    ${chalk.bold('"transformIgnorePatterns"')}: ${chalk.bold(`"${config.preprocessorIgnorePatterns}"`)}
  }

  Please update your configuration.`,

  scriptPreprocessor: (config: Object) => `
  Option ${chalk.bold('scriptPreprocessor')} was replaced by ${chalk.bold('transform')}, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    ${chalk.bold('"transform"')}: ${chalk.bold(`{".*": "${config.scriptPreprocessor}"}`)}
  }

  Please update your configuration.`,
};
/* eslint-enable max-len */

const deprecateWarning = (config: Object, option: string) => {
  if (option in deprecated) {
    deprecationMessage(deprecated[option](config));
  }
};

module.exports = {
  deprecateWarning,
  deprecated,
};
