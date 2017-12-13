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

import createProcesObject from './create_process_object';
import deepCyclicCopy from './deep_cyclic_copy';

const DTRACE = Object.keys(global).filter(key => key.startsWith('DTRACE'));

export default function(globalObject: Global, globals: ConfigGlobals) {
  globalObject.process = createProcesObject();

  // Deep copy all the original global values so that if a test overrides them,
  // we can still get them back.
  if (typeof global.__originalGlobals__ === 'undefined') {
    Object.defineProperty(global, '__originalGlobals__', {
      value: Object.freeze(deepCyclicCopy(global)),
    });
  }

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
