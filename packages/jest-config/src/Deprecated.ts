/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pc from 'picocolors';
import type {DeprecatedOptions} from 'jest-validate';

function formatDeprecation(message: string): string {
  const lines = [
    message.replaceAll(/\*(.+?)\*/g, (_, s) => pc.bold(`"${s}"`)),
    '',
    'Please update your configuration.',
  ];
  return lines.map(s => `  ${s}`).join('\n');
}

const deprecatedOptions: DeprecatedOptions = {
  browser: () =>
    `  Option ${pc.bold(
      '"browser"',
    )} has been deprecated. Please install "browser-resolve" and use the "resolver" option in Jest configuration as shown in the documentation: https://jestjs.io/docs/configuration#resolver-string`,

  collectCoverageOnlyFrom: (_options: {
    collectCoverageOnlyFrom?: Record<string, boolean>;
  }) => `  Option ${pc.bold(
    '"collectCoverageOnlyFrom"',
  )} was replaced by ${pc.bold('"collectCoverageFrom"')}.

    Please update your configuration.`,

  extraGlobals: (_options: {extraGlobals?: string}) => `  Option ${pc.bold(
    '"extraGlobals"',
  )} was replaced by ${pc.bold('"sandboxInjectedGlobals"')}.

  Please update your configuration.`,

  init: () =>
    `  Option ${pc.bold(
      '"init"',
    )} has been deprecated. Please use "create-jest" package as shown in the documentation: https://jestjs.io/docs/getting-started#generate-a-basic-configuration-file`,

  moduleLoader: (_options: {moduleLoader?: string}) => `  Option ${pc.bold(
    '"moduleLoader"',
  )} was replaced by ${pc.bold('"runtime"')}.

  Please update your configuration.`,

  preprocessorIgnorePatterns: (_options: {
    preprocessorIgnorePatterns?: Array<string>;
  }) => `  Option ${pc.bold(
    '"preprocessorIgnorePatterns"',
  )} was replaced by ${pc.bold(
    '"transformIgnorePatterns"',
  )}, which support multiple preprocessors.

  Please update your configuration.`,

  scriptPreprocessor: (_options: {
    scriptPreprocessor?: string;
  }) => `  Option ${pc.bold('"scriptPreprocessor"')} was replaced by ${pc.bold(
    '"transform"',
  )}, which support multiple preprocessors.

  Please update your configuration.`,

  setupTestFrameworkScriptFile: (_options: {
    setupTestFrameworkScriptFile?: string;
  }) => `  Option ${pc.bold(
    '"setupTestFrameworkScriptFile"',
  )} was replaced by configuration ${pc.bold(
    '"setupFilesAfterEnv"',
  )}, which supports multiple paths.

  Please update your configuration.`,

  testPathDirs: (_options: {
    testPathDirs?: Array<string>;
  }) => `  Option ${pc.bold('"testPathDirs"')} was replaced by ${pc.bold(
    '"roots"',
  )}.

  Please update your configuration.
  `,

  testPathPattern: () =>
    formatDeprecation(
      'Option *testPathPattern* was replaced by *testPathPatterns*.',
    ),

  testURL: (_options: {testURL?: string}) => `  Option ${pc.bold(
    '"testURL"',
  )} was replaced by passing the URL via ${pc.bold(
    '"testEnvironmentOptions.url"',
  )}.

  Please update your configuration.`,

  timers: (_options: {timers?: string}) => `  Option ${pc.bold(
    '"timers"',
  )} was replaced by ${pc.bold('"fakeTimers"')}.

  Please update your configuration.`,
};

export default deprecatedOptions;
