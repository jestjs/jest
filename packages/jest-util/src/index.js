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
import FakeTimers from './FakeTimers';
import NullConsole from './NullConsole';
import clearLine from './clearLine';
import formatTestResults from './formatTestResults';
import installCommonGlobals from './installCommonGlobals';
import setGlobal from './setGlobal';
import validateCLIOptions from './validateCLIOptions';

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
  installCommonGlobals,
  setGlobal,
  validateCLIOptions,
};
