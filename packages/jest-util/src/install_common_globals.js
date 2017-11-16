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

export default function(globalObject: Global, globals: ConfigGlobals) {
  globalObject.process = createProcesObject();

  // Forward some APIs.
  globalObject.Buffer = global.Buffer;
  globalObject.setImmediate = global.setImmediate;
  globalObject.clearImmediate = global.clearImmediate;

  Object.assign(global, deepCyclicCopy(globals));
}
