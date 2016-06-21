#!/usr/bin/env node
/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const path = require('path');
const RuntimeCLI = require('../../../jest-runtime/build/cli');

const REPL_SCRIPT = path.resolve(__dirname, './repl.js');

module.exports = function () {
  RuntimeCLI.Run(REPL_SCRIPT);
}
