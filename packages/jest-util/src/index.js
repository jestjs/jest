/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import mkdirp from 'mkdirp';
import fs from 'graceful-fs';

import BufferedConsole from './buffered_console';
import clearLine from './clear_line';
import Console from './Console';
import FakeTimers from './fake_timers';
import formatTestResults from './format_test_results';
import getConsoleOutput from './get_console_output';
import installCommonGlobals from './install_common_globals';
import NullConsole from './null_console';
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

const clearDirectory = (path: string) => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).map(file => {
      const filePath = `${path}/${file}`;
      if (fs.lstatSync(filePath).isDirectory()) {
        clearDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(path);
  }
};

module.exports = {
  BufferedConsole,
  Console,
  FakeTimers,
  NullConsole,
  clearLine,
  createDirectory,
  clearDirectory,
  formatTestResults,
  getConsoleOutput,
  installCommonGlobals,
  setGlobal,
  validateCLIOptions,
};
