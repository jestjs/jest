/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ConfigGlobals} from 'types/Config';
import type {Global} from 'types/Global';

import createProcessObject from './createProcessObject';
import deepCyclicCopy from './deepCyclicCopy';

const DTRACE = Object.keys(global).filter(key => key.startsWith('DTRACE'));

export default function(globalObject: Global, globals: ConfigGlobals) {
  globalObject.process = createProcessObject();

  const symbol = globalObject.Symbol;
  // Keep a reference to some globals that Jest needs
  Object.defineProperties(globalObject, {
    [symbol.for('jest-native-promise')]: {
      enumerable: false,
      value: Promise,
      writable: false,
    },
    [symbol.for('jest-native-now')]: {
      enumerable: false,
      value: globalObject.Date.now.bind(globalObject.Date),
      writable: false,
    },
    'jest-symbol-do-not-touch': {
      enumerable: false,
      value: symbol,
      writable: false,
    },
  });

  // Forward some APIs.
  DTRACE.forEach(dtrace => {
    globalObject[dtrace] = function(...args) {
      return global[dtrace].apply(this, args);
    };
  });

  // Forward some others (this breaks the sandbox but for now it's OK).
  globalObject.Buffer = global.Buffer;
  globalObject.setImmediate = global.setImmediate;
  globalObject.clearImmediate = global.clearImmediate;

  return Object.assign(globalObject, deepCyclicCopy(globals));
}
