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
const JEST = 'Jest';
const DEPRECATED = 'Deprecation Warning';
const DOCUMENTATION_NOTE = `

  ${chalk.bold('Configuration documentation:')}
  https://facebook.github.io/jest/docs/configuration.html
`;
const BULLET = chalk.bold('\u25cf ');

const deprecationMessage = (message: string, options: ValidationOptions) => {
  const footer = options && options.footer
    ? options.footer
    : DOCUMENTATION_NOTE;

  console.warn(
    chalk.yellow(
      options && options.namespace
      ? chalk.bold(BULLET + options.namespace + ' ' + DEPRECATED + ':') +
        message + footer
      : chalk.bold(BULLET + JEST + ' ' + DEPRECATED + ':') + message + footer
    )
  );
};

const deprecateWarning = (
  config: Object,
  option: string,
  deprecatedOptions: Object,
  options: ValidationOptions
) => {
  if (option in deprecatedOptions) {
    deprecationMessage(deprecatedOptions[option](config), options);
  }
};

module.exports = {
  deprecateWarning,
};
