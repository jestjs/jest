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

const buildTestPathPatternInfo = (argv: Object): PatternInfo => {
  const defaultPattern = {
    input: '',
    shouldTreatInputAsPattern: false,
    testPathPattern: '',
  };
  const validatePattern = patternInfo => {
    const {testPathPattern} = patternInfo;
    if (testPathPattern) {
      try {
        /* eslint-disable no-new */
        new RegExp(testPathPattern);
        /* eslint-enable no-new */
      } catch (error) {
        clearLine(process.stdout);
        console.log(chalk.red(
          'Invalid testPattern ' + String(testPathPattern) + ' supplied. ' +
          'Running all tests instead.',
        ));
        return defaultPattern;
      }
    }
    return patternInfo;
  };
  if (argv.onlyChanged) {
    return {
      input: '',
      lastCommit: argv.lastCommit,
      onlyChanged: true,
      watch: argv.watch,
    };
  }
  if (argv.testPathPattern) {
    return validatePattern({
      input: argv.testPathPattern,
      shouldTreatInputAsPattern: true,
      testPathPattern: argv.testPathPattern,
    });
  }
  if (argv._ && argv._.length) {
    return validatePattern({
      findRelatedTests: argv.findRelatedTests,
      input: argv._.join(' '),
      paths: argv._,
      shouldTreatInputAsPattern: false,
      testPathPattern: argv._.join('|'),
    });
  }
  return defaultPattern;
};

module.exports = buildTestPathPatternInfo;
