/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import chalk from 'chalk';
import prettyFormat from 'pretty-format';

const format = (value: mixed) => prettyFormat(value, {min: true});

export default {
  preprocessorIgnorePatterns: (options: {
    preprocessorIgnorePatterns: Array<string>,
  }) => `  Option ${chalk.bold(
    '"preprocessorIgnorePatterns"',
  )} was replaced by ${chalk.bold(
    '"transformIgnorePatterns"',
  )}, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    ${chalk.bold('"transformIgnorePatterns"')}: ${chalk.bold(
    `${format(options.preprocessorIgnorePatterns)}`,
  )}
  }

  Please update your configuration.`,

  scriptPreprocessor: (options: {
    scriptPreprocessor: string,
  }) => `  Option ${chalk.bold(
    '"scriptPreprocessor"',
  )} was replaced by ${chalk.bold(
    '"transform"',
  )}, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    ${chalk.bold('"transform"')}: ${chalk.bold(
    `{".*": ${format(options.scriptPreprocessor)}}`,
  )}
  }

  Please update your configuration.`,

  testPathDirs: (options: {
    testPathDirs: Array<string>,
  }) => `  Option ${chalk.bold('"testPathDirs"')} was replaced by ${chalk.bold(
    '"roots"',
  )}.

  Jest now treats your current configuration as:
  {
    ${chalk.bold('"roots"')}: ${chalk.bold(format(options.testPathDirs))}
  }

  Please update your configuration.
  `,
};
