/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import mkdirp from 'mkdirp';

import Console from './Console';
import FakeTimers from './fake_timers';
import NullConsole from './null_console';
import clearLine from './clear_line';
import formatTestResults from './format_test_results';
import getFailedSnapshotTests from './get_failed_snapshot_tests';
import installCommonGlobals from './install_common_globals';
import setGlobal from './set_global';
import validateCLIOptions from './validate_cli_options';

const createDirectory = (path: string) => {
  try {
    mkdirp.sync(path, '777');
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
};

module.exports = {
  Console,
  FakeTimers,
  NullConsole,
  clearLine,
  createDirectory,
  formatTestResults,
  getFailedSnapshotTests,
  installCommonGlobals,
  setGlobal,
  validateCLIOptions,
};
