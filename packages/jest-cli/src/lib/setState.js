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

const buildTestPathPatternInfo = require('./buildTestPathPatternInfo');

module.exports = (
  argv: Object,
  mode: 'watch' | 'watchAll',
  options?: {},
) => {
  options = options || {};

  if (mode === 'watch') {
    argv.watch = true;
    argv.watchAll = false;
  } else if (mode === 'watchAll') {
    argv.watch = false;
    argv.watchAll = true;
  }

  if (options.testPathPattern) {
    argv.testPathPattern = options.testPathPattern;
  } else if (options.testPathPattern === '') {
    delete argv.testPathPattern;
    delete argv._;
  }

  if (options.testNamePattern) {
    argv.testNamePattern = options.testNamePattern;
  } else if (options.testNamePattern === '') {
    delete argv.testNamePattern;
  }

  argv.onlyChanged = false;
  argv.onlyChanged = buildTestPathPatternInfo(argv).input === ''
    && !argv.watchAll
    && !argv.testNamePattern;

  if (options.noSCM) {
    argv.noSCM = true;
  }
};
