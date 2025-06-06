/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk';
import type {DeprecatedOptions} from 'jest-validate';

function formatDeprecation(message: string): string {
  const lines = [
    message.replaceAll(/\*(.+?)\*/g, (_, s) => chalk.bold(`"${s}"`)),
    '',
    'Please update your configuration.',
  ];
  return lines.map(s => `  ${s}`).join('\n');
}

const deprecatedOptions: DeprecatedOptions = {
  browser: () =>
    `  Option ${chalk.bold(
      '"browser"',
    )} has been deprecated. Please install "browser-resolve" and use the "resolver" option in Jest configuration as shown in the documentation: https://jestjs.io/docs/configuration#resolver-string`,

  collectCoverageOnlyFrom: (_options: {
    collectCoverageOnlyFrom?: Record<string, boolean>;
  }) => `  Option ${chalk.bold(
    '"collectCoverageOnlyFrom"',
  )} was replaced by ${chalk.bold('"collectCoverageFrom"')}.

    Please update your configuration.`,

  extraGlobals: (_options: {extraGlobals?: string}) => `  Option ${chalk.bold(
    '"extraGlobals"',
  )} was replaced by ${chalk.bold('"sandboxInjectedGlobals"')}.

  Please update your configuration.`,

  init: () =>
    `  Option ${chalk.bold(
      '"init"',
    )} has been deprecated. Please use "create-jest" package as shown in the documentation: https://jestjs.io/docs/getting-started#generate-a-basic-configuration-file`,

  moduleLoader: (_options: {moduleLoader?: string}) => `  Option ${chalk.bold(
    '"moduleLoader"',
  )} was replaced by ${chalk.bold('"runtime"')}.

  Please update your configuration.`,

  preprocessorIgnorePatterns: (_options: {
    preprocessorIgnorePatterns?: Array<string>;
  }) => `  Option ${chalk.bold(
    '"preprocessorIgnorePatterns"',
  )} was replaced by ${chalk.bold(
    '"transformIgnorePatterns"',
  )}, which support multiple preprocessors.

  Please update your configuration.`,

  scriptPreprocessor: (_options: {
    scriptPreprocessor?: string;
  }) => `  Option ${chalk.bold(
    '"scriptPreprocessor"',
  )} was replaced by ${chalk.bold(
    '"transform"',
  )}, which support multiple preprocessors.

  Please update your configuration.`,

  setupTestFrameworkScriptFile: (_options: {
    setupTestFrameworkScriptFile?: string;
  }) => `  Option ${chalk.bold(
    '"setupTestFrameworkScriptFile"',
  )} was replaced by configuration ${chalk.bold(
    '"setupFilesAfterEnv"',
  )}, which supports multiple paths.

  Please update your configuration.`,

  testPathDirs: (_options: {
    testPathDirs?: Array<string>;
  }) => `  Option ${chalk.bold('"testPathDirs"')} was replaced by ${chalk.bold(
    '"roots"',
  )}.

  Please update your configuration.
  `,

  testPathPattern: () =>
    formatDeprecation(
      'Option *testPathPattern* was replaced by *--testPathPatterns*. *--testPathPatterns* is only available as a command-line option.',
    ),

  testURL: (_options: {testURL?: string}) => `  Option ${chalk.bold(
    '"testURL"',
  )} was replaced by passing the URL via ${chalk.bold(
    '"testEnvironmentOptions.url"',
  )}.

  Please update your configuration.`,

  timers: (_options: {timers?: string}) => `  Option ${chalk.bold(
    '"timers"',
  )} was replaced by ${chalk.bold('"fakeTimers"')}.

  Please update your configuration.`,
};

export default deprecatedOptions;
