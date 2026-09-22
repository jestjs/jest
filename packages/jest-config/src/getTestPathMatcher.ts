/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import type {Config} from '@jest/types';
import {escapePathForRegex} from 'jest-regex-util';
import {globsToMatcher} from 'jest-util';

/**
 * The project config fields that decide whether a path is a test file of a
 * project. These four fields are the complete set of inputs Jest's own project
 * matching depends on, and unlike the rest of a `ProjectConfig` they can be
 * computed without any filesystem or module resolution work.
 *
 * All values must be the normalized ones Jest ends up with (i.e. what
 * `normalize()`/`readConfig()` produce on a `ProjectConfig`):
 * - `roots` are absolute paths (defaults to `[rootDir]`).
 * - `testMatch`, `testPathIgnorePatterns` and `testRegex` are arrays; a
 *   `testRegex` written as a string in a config file is normalized to a
 *   one-element array.
 */
export type TestPathMatcherConfig = Pick<
  Config.ProjectConfig,
  'roots' | 'testMatch' | 'testPathIgnorePatterns' | 'testRegex'
>;

export type TestPathCase = {
  /**
   * Name of the config option the case was built from. Used by Jest to report
   * per-option counts when filtering test paths.
   */
  stat: 'roots' | 'testMatch' | 'testPathIgnorePatterns' | 'testRegex';
  isMatch: (path: string) => boolean;
};

export type TestPathMatcher = {
  /**
   * The individual rules, in the order they are evaluated. A path is a test
   * file of the project only if every case matches it.
   */
  cases: ReadonlyArray<TestPathCase>;
  /**
   * Whether `path` is a test file belonging to the project the config
   * describes. `path` is expected to be absolute.
   */
  isTestFilePath: (path: string) => boolean;
};

const regexToMatcher = (testRegex: Config.ProjectConfig['testRegex']) => {
  const regexes = testRegex.map(testRegex => new RegExp(testRegex));

  return (path: string) =>
    regexes.some(regex => {
      const result = regex.test(path);

      // prevent stateful regexes from breaking, just in case
      regex.lastIndex = 0;

      return result;
    });
};

/**
 * Builds the matcher that decides whether a path is a test file of the project
 * described by `config`.
 *
 * This is the logic Jest uses internally to answer "does this project own this
 * file?", exposed so that tooling around Jest (e.g. `eslint-plugin-jest`) can
 * answer the same question without reimplementing it: given a file path and a
 * Jest config, which project's options apply?
 *
 * The matcher is built purely from the config, so no `TestContext` (haste map,
 * module map or resolver) is needed.
 *
 * @example
 * const {isTestFilePath} = getTestPathMatcher(projectConfig);
 * isTestFilePath('/repo/packages/app/src/foo.test.ts'); // true
 *
 * @param config The normalized project config subset to match with.
 * @returns The matcher, plus the individual cases it is made of.
 */
export function getTestPathMatcher(
  config: TestPathMatcherConfig,
): TestPathMatcher {
  const cases: Array<TestPathCase> = [];

  const rootPattern = new RegExp(
    config.roots.map(dir => escapePathForRegex(dir + path.sep)).join('|'),
  );

  cases.push({
    isMatch: path => rootPattern.test(path),
    stat: 'roots',
  });

  if (config.testMatch.length > 0) {
    cases.push({
      isMatch: globsToMatcher(config.testMatch),
      stat: 'testMatch',
    });
  }

  if (config.testPathIgnorePatterns.length > 0) {
    const testIgnorePatternsRegex = new RegExp(
      config.testPathIgnorePatterns.join('|'),
    );

    cases.push({
      isMatch: path => !testIgnorePatternsRegex.test(path),
      stat: 'testPathIgnorePatterns',
    });
  }

  if (config.testRegex.length > 0) {
    cases.push({
      isMatch: regexToMatcher(config.testRegex),
      stat: 'testRegex',
    });
  }

  return {
    cases,
    isTestFilePath: (path: string) =>
      cases.every(testCase => testCase.isMatch(path)),
  };
}
