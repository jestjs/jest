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

import type {Path, ProjectConfig} from 'types/Config';
import type {Options} from './ScriptTransformer';

const {escapePathForRegex} = require('jest-regex-util');
const micromatch = require('micromatch');
const path = require('path');

const MOCKS_PATTERN = new RegExp(
  escapePathForRegex(path.sep + '__mocks__' + path.sep),
);

const shouldInstrument = (
  filename: Path,
  options: Options,
  config: ProjectConfig,
): boolean => {
  if (!options.collectCoverage) {
    return false;
  }

  if (config.testRegex && filename.match(config.testRegex)) {
    return false;
  }

  if (
    config.testMatch &&
    config.testMatch.length &&
    micromatch.any(filename, config.testMatch)
  ) {
    return false;
  }

  if (
    // This configuration field contains an object in the form of:
    // {'path/to/file.js': true}
    options.collectCoverageOnlyFrom &&
    !options.collectCoverageOnlyFrom[filename]
  ) {
    return false;
  }

  if (
    // still cover if `only` is specified
    !options.collectCoverageOnlyFrom &&
    options.collectCoverageFrom &&
    !micromatch(
      [path.relative(config.rootDir, filename)],
      options.collectCoverageFrom,
    ).length
  ) {
    return false;
  }

  if (
    config.coveragePathIgnorePatterns &&
    config.coveragePathIgnorePatterns.some(pattern => filename.match(pattern))
  ) {
    return false;
  }

  if (MOCKS_PATTERN.test(filename)) {
    return false;
  }

  return true;
};

module.exports = shouldInstrument;
