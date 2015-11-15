/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
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
  global.process = Object.assign({}, process);
  global.process.on = process.on.bind(process);
  global.setImmediate = setImmediate;
  global.clearImmediate = clearImmediate;
  Object.assign(global, utils.deepCopy(globals));
};
