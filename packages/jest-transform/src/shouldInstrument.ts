/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import micromatch from 'micromatch';
import type {Config} from '@jest/types';
import {escapePathForRegex} from 'jest-regex-util';
import {globsToMatcher, replacePathSepForGlob} from 'jest-util';
import type {ShouldInstrumentOptions} from './types';

const MOCKS_PATTERN = new RegExp(
  escapePathForRegex(`${path.sep}__mocks__${path.sep}`),
);

const cachedRegexes = new Map<string, RegExp>();
const getRegex = (regexStr: string) => {
  if (!cachedRegexes.has(regexStr)) {
    cachedRegexes.set(regexStr, new RegExp(regexStr));
  }

  const regex = cachedRegexes.get(regexStr)!;

  // prevent stateful regexes from breaking, just in case
  regex.lastIndex = 0;

  return regex;
};

export default function shouldInstrument(
  filename: string,
  options: ShouldInstrumentOptions,
  config: Config.ProjectConfig,
  loadedFilenames?: Array<string>,
): boolean {
  if (!options.collectCoverage) {
    return false;
  }

  if (
    config.forceCoverageMatch.length > 0 &&
    micromatch.any(filename, config.forceCoverageMatch)
  ) {
    return true;
  }

  if (
    !config.testPathIgnorePatterns.some(pattern =>
      getRegex(pattern).test(filename),
    )
  ) {
    if (config.testRegex.some(regex => new RegExp(regex).test(filename))) {
      return false;
    }

    if (globsToMatcher(config.testMatch)(replacePathSepForGlob(filename))) {
      return false;
    }
  }

  if (
    options.collectCoverageFrom.length === 0 &&
    loadedFilenames != null &&
    !loadedFilenames.includes(filename)
  ) {
    return false;
  }

  if (
    // still cover if `only` is specified
    options.collectCoverageFrom.length > 0 &&
    !globsToMatcher(options.collectCoverageFrom)(
      replacePathSepForGlob(
        path.relative(options.globalRootDir ?? config.rootDir, filename),
      ),
    )
  ) {
    return false;
  }

  if (
    config.coveragePathIgnorePatterns.some(pattern =>
      new RegExp(pattern).test(filename),
    )
  ) {
    return false;
  }

  if (config.globalSetup === filename) {
    return false;
  }

  if (config.globalTeardown === filename) {
    return false;
  }

  if (config.setupFiles.includes(filename)) {
    return false;
  }

  if (config.setupFilesAfterEnv.includes(filename)) {
    return false;
  }

  if (MOCKS_PATTERN.test(filename)) {
    return false;
  }

  if (options.changedFiles && !options.changedFiles.has(filename)) {
    if (!options.sourcesRelatedToTestsInChangedFiles) {
      return false;
    }
    if (!options.sourcesRelatedToTestsInChangedFiles.has(filename)) {
      return false;
    }
  }

  if (filename.endsWith('.json')) {
    return false;
  }

  return true;
}
