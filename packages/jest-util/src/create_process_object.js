/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import deepCyclicCopy from './deep_cyclic_copy';

const BLACKLIST = new Set(['env', 'mainModule', '_events']);

// The "process.env" object has a bunch of particularities: first, it does not
// directly extend from Object; second, it converts any assigned value to a
// string; and third, it is case-insensitive in Windows. We use a proxy here to
// mimic it (see https://nodejs.org/api/process.html#process_process_env).

function createProcessEnv() {
  if (typeof Proxy === 'undefined') {
    return deepCyclicCopy(process.env);
  }

  // $FlowFixMe: Apparently Flow does not understand that this is a prototype.
  const proto: Object = Object.getPrototypeOf(process.env);
  const real = Object.create(proto);
  const lookup = {};

  const proxy = new Proxy(real, {
    deleteProperty(target, key) {
      for (const name in real) {
        if (real.hasOwnProperty(name)) {
          if (typeof key === 'string' && process.platform === 'win32') {
            if (name.toLowerCase() === key.toLowerCase()) {
              delete real[name];
              delete lookup[name.toLowerCase()];
            }
          } else {
            if (key === name) {
              delete real[name];
              delete lookup[name];
            }
          }
        }
      }

      return true;
    },

    get(target, key) {
      if (typeof key === 'string' && process.platform === 'win32') {
        return lookup[key in proto ? key : key.toLowerCase()];
      } else {
        return real[key];
      }
    },

    set(target, key, value) {
      const strValue = '' + value;

      if (typeof key === 'string') {
        lookup[key.toLowerCase()] = strValue;
      }

      real[key] = strValue;

      return true;
    },
  });

  return Object.assign(proxy, process.env);
}

export default function() {
  const process = require('process');
  const newProcess = deepCyclicCopy(process, {
    blacklist: BLACKLIST,
    keepPrototype: true,
  });

  newProcess[Symbol.toStringTag] = 'process';

  // Sequentially execute all constructors over the object.
  let proto = process;

  while ((proto = Object.getPrototypeOf(proto))) {
    if (typeof proto.constructor === 'function') {
      proto.constructor.call(newProcess);
    }
  }

  newProcess.env = createProcessEnv();
  newProcess.send = () => {};

  return newProcess;
}
