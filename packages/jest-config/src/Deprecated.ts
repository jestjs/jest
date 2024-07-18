/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pico from 'picocolors';
import type {DeprecatedOptions} from 'jest-validate';

function formatDeprecation(message: string): string {
  const lines = [
    message.replaceAll(/\*(.+?)\*/g, (_, s) => pico.bold(`"${s}"`)),
    '',
    'Please update your configuration.',
  ];
  return lines.map(s => `  ${s}`).join('\n');
}

const deprecatedOptions: DeprecatedOptions = {
  browser: () =>
    `  Option ${pico.bold(
      '"browser"',
    )} has been deprecated. Please install "browser-resolve" and use the "resolver" option in Jest configuration as shown in the documentation: https://jestjs.io/docs/configuration#resolver-string`,

  collectCoverageOnlyFrom: (_options: {
    collectCoverageOnlyFrom?: Record<string, boolean>;
  }) => `  Option ${pico.bold(
    '"collectCoverageOnlyFrom"',
  )} was replaced by ${pico.bold('"collectCoverageFrom"')}.

    Please update your configuration.`,

  extraGlobals: (_options: {extraGlobals?: string}) => `  Option ${pico.bold(
    '"extraGlobals"',
  )} was replaced by ${pico.bold('"sandboxInjectedGlobals"')}.

  Please update your configuration.`,

  init: () =>
    `  Option ${pico.bold(
      '"init"',
    )} has been deprecated. Please use "create-jest" package as shown in the documentation: https://jestjs.io/docs/getting-started#generate-a-basic-configuration-file`,

  moduleLoader: (_options: {moduleLoader?: string}) => `  Option ${pico.bold(
    '"moduleLoader"',
  )} was replaced by ${pico.bold('"runtime"')}.

  Please update your configuration.`,

  preprocessorIgnorePatterns: (_options: {
    preprocessorIgnorePatterns?: Array<string>;
  }) => `  Option ${pico.bold(
    '"preprocessorIgnorePatterns"',
  )} was replaced by ${pico.bold(
    '"transformIgnorePatterns"',
  )}, which support multiple preprocessors.

  Please update your configuration.`,

  scriptPreprocessor: (_options: {
    scriptPreprocessor?: string;
  }) => `  Option ${pico.bold(
    '"scriptPreprocessor"',
  )} was replaced by ${pico.bold(
    '"transform"',
  )}, which support multiple preprocessors.

  Please update your configuration.`,

  setupTestFrameworkScriptFile: (_options: {
    setupTestFrameworkScriptFile?: string;
  }) => `  Option ${pico.bold(
    '"setupTestFrameworkScriptFile"',
  )} was replaced by configuration ${pico.bold(
    '"setupFilesAfterEnv"',
  )}, which supports multiple paths.

  Please update your configuration.`,

  testPathDirs: (_options: {
    testPathDirs?: Array<string>;
  }) => `  Option ${pico.bold('"testPathDirs"')} was replaced by ${pico.bold(
    '"roots"',
  )}.

  Please update your configuration.
  `,

  testPathPattern: () =>
    formatDeprecation(
      'Option *testPathPattern* was replaced by *testPathPatterns*.',
    ),

  testURL: (_options: {testURL?: string}) => `  Option ${pico.bold(
    '"testURL"',
  )} was replaced by passing the URL via ${pico.bold(
    '"testEnvironmentOptions.url"',
  )}.

  Please update your configuration.`,

  timers: (_options: {timers?: string}) => `  Option ${pico.bold(
    '"timers"',
  )} was replaced by ${pico.bold('"fakeTimers"')}.

  Please update your configuration.`,
};

export default deprecatedOptions;
