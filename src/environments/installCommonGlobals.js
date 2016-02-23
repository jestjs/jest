/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const utils = require('../lib/utils');
const EventEmitter = require('events').EventEmitter;

module.exports = (global, globals) => {
  // Forward some APIs
  global.Buffer = Buffer;
  // `global.process` is mutated by FakeTimers. Make a copy of the
  // object for the jsdom environment to prevent memory leaks.
  global.process = Object.assign({}, process);

  // Correctly bind all event functions
  for (var func in EventEmitter.prototype)
  {
    if (typeof EventEmitter.prototype[func] == 'function')
    {
      global.process[func] = process[func].bind(process);
    }
  }

  global.setImmediate = setImmediate;
  global.clearImmediate = clearImmediate;
  Object.assign(global, utils.deepCopy(globals));
};
