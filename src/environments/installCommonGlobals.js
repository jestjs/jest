/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const utils = require('../lib/utils');

module.exports = (global, globals) => {
  // Forward some APIs
  global.Buffer = Buffer;
  // `global.process` is mutated by FakeTimers. Make a copy of the
  // object for the jsdom environment to prevent memory leaks.
  global.process                    = Object.assign({}, process);

  // Correctly bind all EventEmitter functions
  global.process.setMaxListeners    = process.setMaxListeners.bind(process);
  global.process.getMaxListeners    = process.getMaxListeners.bind(process);
  global.process.emit               = process.emit.bind(process);
  global.process.addListener        = process.addListener.bind(process);
  global.process.on                 = process.on.bind(process);
  global.process.once               = process.once.bind(process);
  global.process.removeListener     = process.removeListener.bind(process);
  global.process.removeAllListeners = process.removeAllListeners.bind(process);
  global.process.listeners          = process.listeners.bind(process);
  global.process.listenerCount      = process.listenerCount.bind(process);

  global.setImmediate               = setImmediate;
  global.clearImmediate             = clearImmediate;

  Object.assign(global, utils.deepCopy(globals));
};
