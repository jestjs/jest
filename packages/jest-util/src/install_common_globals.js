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

function deepCopy(obj) {
  const newObj = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      let value = obj[key];

      if (typeof value === 'object' && value !== null) {
        value = deepCopy(value);
      }

      newObj[key] = value;
    }
  }

  return newObj;
}

export default (globalObject: Global, globals: ConfigGlobals) => {
  let prototype = Object.getPrototypeOf(process);
  const processObject = Object.create(prototype);
  const processBlacklist = /^mainModule$/g;

  // Sequentially execute all constructors over the object.
  do {
    // $FlowFixMe: constructor is always defined.
    prototype.constructor.call(processObject);
  } while ((prototype = Object.getPrototypeOf(prototype)));

  // Forward some APIs.
  globalObject.Buffer = global.Buffer;

  // Make a copy of "process" to avoid memory leaks.
  if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    // $FlowFixMe: "Symbol.toStringTag" is defined in "process".
    processObject[Symbol.toStringTag] = process[Symbol.toStringTag];
  }

  // Copy all remaining properties that are not already in the object.
  for (const key in process) {
    if (process.hasOwnProperty(key) && !processObject.hasOwnProperty(key)) {
      if (!processBlacklist.test(key)) {
        // $FlowFixMe: Copying properties is fine.
        processObject[key] = process[key];
      }
    }
  }

  globalObject.process = processObject;
  globalObject.setImmediate = global.setImmediate;
  globalObject.clearImmediate = global.clearImmediate;

  Object.assign(global, deepCopy(globals));
};
