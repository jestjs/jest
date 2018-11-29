/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import mkdirp from 'mkdirp';

import BufferedConsole from './BufferedConsole';
import clearLine from './clearLine';
import {default as Console} from './CustomConsole';
import ErrorWithStack from './ErrorWithStack';
import FakeTimers from './FakeTimers';
import formatTestResults from './formatTestResults';
import getFailedSnapshotTests from './getFailedSnapshotTests';
import getConsoleOutput from './getConsoleOutput';
import installCommonGlobals from './installCommonGlobals';
import NullConsole from './NullConsole';
import isInteractive from './isInteractive';
import getCallsite from './getCallsite';
import setGlobal from './setGlobal';
import deepCyclicCopy from './deepCyclicCopy';
import convertDescriptorToString from './convertDescriptorToString';
import {toMilliseconds} from './toMilliseconds';

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
  BufferedConsole,
  Console,
  ErrorWithStack,
  FakeTimers,
  NullConsole,
  clearLine,
  convertDescriptorToString,
  createDirectory,
  deepCyclicCopy,
  formatTestResults,
  getCallsite,
  getConsoleOutput,
  getFailedSnapshotTests,
  installCommonGlobals,
  isInteractive,
  setGlobal,
  toMilliseconds,
};
