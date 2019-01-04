/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import mkdirp from 'mkdirp';
import * as specialChars from './specialChars';

export {default as BufferedConsole} from './BufferedConsole';
export {default as clearLine} from './clearLine';
export {default as Console} from './CustomConsole';
export {default as ErrorWithStack} from './ErrorWithStack';
export {default as FakeTimers} from './FakeTimers';
export {default as formatTestResults} from './formatTestResults';
export {default as getFailedSnapshotTests} from './getFailedSnapshotTests';
export {default as getConsoleOutput} from './getConsoleOutput';
export {default as installCommonGlobals} from './installCommonGlobals';
export {default as NullConsole} from './NullConsole';
export {default as isInteractive} from './isInteractive';
export {default as getCallsite} from './getCallsite';
export {default as setGlobal} from './setGlobal';
export {default as deepCyclicCopy} from './deepCyclicCopy';
export {
  default as convertDescriptorToString,
} from './convertDescriptorToString';
export {specialChars};
export {default as interopRequireDefault} from './interopRequireDefault';

export const createDirectory = (path: string) => {
  try {
    mkdirp.sync(path, '777');
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
};
