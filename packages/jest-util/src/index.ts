/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO: Remove these exports in the next major
import {JestFakeTimers as FakeTimers} from '@jest/fake-timers';
import {getCallsite} from '@jest/source-map';
import {
  BufferedConsole,
  CustomConsole,
  NullConsole,
  getConsoleOutput,
} from '@jest/console';
import {formatTestResults} from '@jest/test-result';
import clearLine from './clearLine';
import createDirectory from './createDirectory';
import ErrorWithStack from './ErrorWithStack';
import getFailedSnapshotTests from './getFailedSnapshotTests';
import installCommonGlobals from './installCommonGlobals';
import isInteractive from './isInteractive';
import setGlobal from './setGlobal';
import deepCyclicCopy from './deepCyclicCopy';
import convertDescriptorToString from './convertDescriptorToString';
import * as specialChars from './specialChars';
import replacePathSepForGlob from './replacePathSepForGlob';
import testPathPatternToRegExp from './testPathPatternToRegExp';
import * as preRunMessage from './preRunMessage';
import pluralize from './pluralize';

export = {
  BufferedConsole,
  Console: CustomConsole,
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
  pluralize,
  preRunMessage,
  replacePathSepForGlob,
  setGlobal,
  specialChars,
  testPathPatternToRegExp,
};
