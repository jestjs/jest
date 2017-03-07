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

import type {PatternInfo} from '../SearchSource';

const {clearLine} = require('jest-util');
const chalk = require('chalk');
const validatePattern = require('./validatePattern');

const DEFAULT_PATTERN_INFO = {
  input: '',
  shouldTreatInputAsPattern: false,
  testPathPattern: '',
};

const showTestPathPatternError = (testPathPattern: string) => {
  clearLine(process.stdout);

  // eslint-disable-next-line max-len
  console.log(
    chalk.red(
      `  Invalid testPattern ${testPathPattern} supplied. ` +
      `Running all tests instead.`,
    ),
  );
};

module.exports = (argv: Object): PatternInfo => {
  if (argv.onlyChanged) {
    return {
      input: '',
      lastCommit: argv.lastCommit,
      onlyChanged: true,
      watch: argv.watch,
    };
  }

  if (argv.testPathPattern) {
    if (validatePattern(argv.testPathPattern)) {
      return {
        input: argv.testPathPattern,
        shouldTreatInputAsPattern: true,
        testPathPattern: argv.testPathPattern,
      };
    } else {
      showTestPathPatternError(argv.testPathPattern);
    }
  }

  if (argv._ && argv._.length) {
    const testPathPattern = argv._.join('|');

    if (validatePattern(testPathPattern)) {
      return {
        findRelatedTests: argv.findRelatedTests,
        input: argv._.join(' '),
        paths: argv._,
        shouldTreatInputAsPattern: false,
        testPathPattern,
      };
    } else {
      showTestPathPatternError(testPathPattern);
    }
  }

  return DEFAULT_PATTERN_INFO;
};
