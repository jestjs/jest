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

import type {Argv} from 'types/Argv';

const getTestPathPattern = require('./getTestPathPattern');

type Options = {|
  testNamePattern?: string,
  testPathPattern?: string,
  noSCM?: boolean,
|};

module.exports = (argv: Argv, mode: 'watch' | 'watchAll', options: Options) => {
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
  argv.onlyChanged =
    getTestPathPattern(argv).input === '' &&
    !argv.watchAll &&
    !argv.testNamePattern;

  if (options.noSCM) {
    argv.noSCM = true;
  }
};
