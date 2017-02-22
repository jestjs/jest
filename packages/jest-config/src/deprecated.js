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
const format = (value: string) => require('pretty-format')(value, {min: true});

/* eslint-disable max-len */
const deprecatedOptions = {
  preprocessorIgnorePatterns: (config: Object) =>
    `  Option ${chalk.bold(
      '"preprocessorIgnorePatterns"',
    )} was replaced by ${chalk.bold(
      '"transformIgnorePatterns"',
    )}, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    ${chalk.bold('"transformIgnorePatterns"')}: ${chalk.bold(
      `${format(config.preprocessorIgnorePatterns)}`,
    )}
  }

  Please update your configuration.`,

  scriptPreprocessor: (config: Object) =>
    `  Option ${chalk.bold(
      '"scriptPreprocessor"',
    )} was replaced by ${chalk.bold(
      '"transform"',
    )}, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    ${chalk.bold('"transform"')}: ${chalk.bold(
      `{".*": ${format(config.scriptPreprocessor)}}`,
    )}
  }

  Please update your configuration.`,

  testPathDirs: (config: Object) =>
    `  Option ${chalk.bold('"testPathDirs"')} was replaced by ${chalk.bold(
      '"roots"',
    )}.

  Jest now treats your current configuration as:
  {
    ${chalk.bold('"roots"')}: ${chalk.bold(format(config.testPathDirs))}
  }

  Please update your configuration.
  `,
};
/* eslint-enable max-len */

module.exports = deprecatedOptions;
