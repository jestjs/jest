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
const DEPRECATED = 'Jest Deprecation Warning';
const DOCUMENTATION_NOTE = `

  ${chalk.bold('Configuration documentation:')}
  https://facebook.github.io/jest/docs/configuration.html
`;
const BULLET = chalk.bold('\u25cf ');

const deprecationMessage = (message: string) => {
  console.warn(
    chalk.yellow(
      chalk.bold(BULLET + DEPRECATED + ':') + message + DOCUMENTATION_NOTE
    )
  );
};

const deprecateWarning = (
  config: Object,
  option: string,
  deprecatedOptions: Object
) => {
  if (option in deprecatedOptions) {
    deprecationMessage(deprecatedOptions[option](config));
  }
};

module.exports = {
  deprecateWarning,
};
