/**
* Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*
* @flow
*/

import type {ConfigGlobals} from 'types/Config';
import type {Global} from 'types/Global';

function deepCopy(obj) {
  const newObj = {};
  let value;
  for (const key in obj) {
    value = obj[key];
    if (typeof value === 'object' && value !== null) {
      value = deepCopy(value);
    }
    newObj[key] = value;
  }
  return newObj;
}

module.exports = (global: Global, globals: ConfigGlobals) => {
  // Forward some APIs
  global.Buffer = Buffer;

  global.ArrayBuffer = ArrayBuffer;
  global.DataView = DataView;

  global.Uint8Array = Uint8Array;
  global.Uint8ClampedArray = Uint8ClampedArray;
  global.Uint16Array = Uint16Array;
  global.Uint32Array = Uint32Array;
  global.Int8Array = Int8Array;
  global.Int16Array = Int16Array;
  global.Int32Array = Int32Array;
  global.Float32Array = Float32Array;
  global.Float64Array = Float64Array;

  global.Map = Map;
  global.Set = Set;

  global.Promise = Promise;

  // `global.process` is mutated by FakeTimers. Make a copy of the
  // object for the jsdom environment to prevent memory leaks.
  // Overwrite toString to make it look like the real process object
  let toStringOverwrite;
  if (Symbol && Symbol.toStringTag) {
    // $FlowFixMe
    toStringOverwrite = {
      [Symbol.toStringTag]: 'process',
    };
  }
  global.process = Object.assign({}, process, toStringOverwrite);
  global.process.setMaxListeners = process.setMaxListeners.bind(process);
  global.process.getMaxListeners = process.getMaxListeners.bind(process);
  global.process.emit = process.emit.bind(process);
  global.process.addListener = process.addListener.bind(process);
  global.process.on = process.on.bind(process);
  global.process.once = process.once.bind(process);
  global.process.removeListener = process.removeListener.bind(process);
  global.process.removeAllListeners = process.removeAllListeners.bind(process);
  global.process.listeners = process.listeners.bind(process);
  global.process.listenerCount = process.listenerCount.bind(process);

  global.setImmediate = setImmediate;
  global.clearImmediate = clearImmediate;

  Object.assign(global, deepCopy(globals));
};
