/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import deepCyclicCopy from './deepCyclicCopy';

const BLACKLIST = new Set(['env', 'mainModule', '_events']);
const isWin32 = process.platform === 'win32';
const proto: Record<string, unknown> = Object.getPrototypeOf(process.env);

// The "process.env" object has a bunch of particularities: first, it does not
// directly extend from Object; second, it converts any assigned value to a
// string; and third, it is case-insensitive in Windows. We use a proxy here to
// mimic it (see https://nodejs.org/api/process.html#process_process_env).

function createProcessEnv(): NodeJS.ProcessEnv {
  const real = Object.create(proto);
  const lookup: typeof process.env = {};

  function deletePropertyWin32(_target: unknown, key: unknown) {
    for (const name in real) {
      if (Object.prototype.hasOwnProperty.call(real, name)) {
        if (typeof key === 'string') {
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
  }

  function deleteProperty(_target: unknown, key: any) {
    delete real[key];
    delete lookup[key];

    return true;
  }

  function getProperty(_target: unknown, key: any) {
    return real[key];
  }

  function getPropertyWin32(_target: unknown, key: any) {
    if (typeof key === 'string') {
      return lookup[key in proto ? key : key.toLowerCase()];
    } else {
      return real[key];
    }
  }

  const proxy = new Proxy(real, {
    deleteProperty: isWin32 ? deletePropertyWin32 : deleteProperty,
    get: isWin32 ? getPropertyWin32 : getProperty,

    set(_target, key, value) {
      const strValue = `${value}`;

      if (typeof key === 'string') {
        lookup[key.toLowerCase()] = strValue;
      }

      real[key] = strValue;

      return true;
    },
  });

  return Object.assign(proxy, process.env);
}

export default function createProcessObject(): NodeJS.Process {
  const process = require('process');
  const newProcess = deepCyclicCopy(process, {
    blacklist: BLACKLIST,
    keepPrototype: true,
  });

  try {
    // This fails on Node 12, but it's already set to 'process'
    newProcess[Symbol.toStringTag] = 'process';
  } catch (e: any) {
    // Make sure it's actually set instead of potentially ignoring errors
    if (newProcess[Symbol.toStringTag] !== 'process') {
      e.message = `Unable to set toStringTag on process. Please open up an issue at https://github.com/jestjs/jest\n\n${e.message}`;

      throw e;
    }
  }

  // Sequentially execute all constructors over the object.
  let proto = process;

  while ((proto = Object.getPrototypeOf(proto))) {
    if (typeof proto.constructor === 'function') {
      proto.constructor.call(newProcess);
    }
  }

  newProcess.env = createProcessEnv();
  newProcess.send = () => true;

  Object.defineProperty(newProcess, 'domain', {
    get() {
      return process.domain;
    },
  });

  return newProcess;
}
