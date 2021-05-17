/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {DeprecatedOptions} from 'jest-validate';
import {format as prettyFormat} from 'pretty-format';

const format = (value: unknown) => prettyFormat(value, {min: true});

const deprecatedOptions: DeprecatedOptions = {
  browser: () =>
    `  Option ${chalk.bold(
      '"browser"',
    )} has been deprecated. Please install "browser-resolve" and use the "resolver" option in Jest configuration as shown in the documentation: https://jestjs.io/docs/configuration#resolver-string`,

  preprocessorIgnorePatterns: (options: {
    preprocessorIgnorePatterns?: Array<string>;
  }) => `  Option ${chalk.bold(
    '"preprocessorIgnorePatterns"',
  )} was replaced by ${chalk.bold(
    '"transformIgnorePatterns"',
  )}, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    ${chalk.bold('"transformIgnorePatterns"')}: ${chalk.bold(
    format(options.preprocessorIgnorePatterns),
  )}
  }

  Please update your configuration.`,

  scriptPreprocessor: (options: {
    scriptPreprocessor?: string;
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

  setupTestFrameworkScriptFile: (_options: {
    setupTestFrameworkScriptFile?: string;
  }) => `  Option ${chalk.bold(
    '"setupTestFrameworkScriptFile"',
  )} was replaced by configuration ${chalk.bold(
    '"setupFilesAfterEnv"',
  )}, which supports multiple paths.

  Please update your configuration.`,

  testPathDirs: (options: {
    testPathDirs?: Array<string>;
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

export default deprecatedOptions;
