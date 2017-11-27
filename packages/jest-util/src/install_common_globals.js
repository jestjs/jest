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

// Matches macros referenced in Node repository, under the "src" folder.
const MACROS = Object.keys(global).filter(key => {
  return /^(?:DTRACE|LTTNG|COUNTER)_/.test(key);
});

export default function(globalObject: Global, globals: ConfigGlobals) {
  globalObject.process = createProcesObject();

  // Forward some APIs.
  MACROS.forEach(macro => {
    globalObject[macro] = function(...args) {
      return global[macro].apply(this, args);
    };
  });

  // Forward some others (this breaks the sandbox but for now it's OK).
  globalObject.Buffer = global.Buffer;
  globalObject.setImmediate = global.setImmediate;
  globalObject.clearImmediate = global.clearImmediate;

  return Object.assign(globalObject, deepCyclicCopy(globals));
}
