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

import createProcessObject from './create_process_object';
import deepCyclicCopy from './deep_cyclic_copy';

const DTRACE = Object.keys(global).filter(key => key.startsWith('DTRACE'));

export default function(globalObject: Global, globals: ConfigGlobals) {
  globalObject.process = createProcessObject();

  // Keep a reference to "Promise", since "jasmine_light.js" needs it.
  globalObject[globalObject.Symbol.for('jest-native-promise')] = Promise;

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
