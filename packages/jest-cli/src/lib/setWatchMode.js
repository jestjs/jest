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

const setWatchMode = (
  argv: Object,
  mode: 'watch' | 'watchAll',
  options?: Object,
) => {
  if (mode === 'watch') {
    argv.watch = true;
    argv.watchAll = false;
  } else if (mode === 'watchAll') {
    argv.watch = false;
    argv.watchAll = true;
  }

  // Reset before setting these to the new values
  argv._ = (options && options.pattern) || '';
  argv.onlyChanged = false;
  argv.onlyChanged =
    buildTestPathPatternInfo(argv).input === '' && !argv.watchAll;

  if (options && options.noSCM) {
    argv.noSCM = true;
  }
};

module.exports = setWatchMode;
