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

import type {Config, Path} from 'types/Config';

const {escapePathForRegex} = require('jest-util');
const micromatch = require('micromatch');
const path = require('path');

const MOCKS_PATTERN =
  new RegExp(escapePathForRegex(path.sep + '__mocks__' + path.sep));

const shouldInstrument = (filename: Path, config: Config): boolean => {
  if (!config.collectCoverage) {
    return false;
  }

  if (config.testRegex && filename.match(config.testRegex)) {
    return false;
  }

  if (
    config.testMatch &&
    config.testMatch.length &&
    micromatch.any(filename, config.testMatch)) {
    return false;
  }

  if (
    // This configuration field contains an object in the form of:
    // {'path/to/file.js': true}
    config.collectCoverageOnlyFrom &&
    !config.collectCoverageOnlyFrom[filename]
  ) {
    return false;
  }

  if (
    !config.collectCoverageOnlyFrom && // still cover if `only` is specified
    config.collectCoverageFrom &&
    !micromatch(
      [path.relative(config.rootDir, filename)],
      config.collectCoverageFrom,
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
