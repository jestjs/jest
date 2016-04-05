/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';
const path = require('path');
const fs = require('fs');

let notNPM = true;
const setup_file = path.resolve(__dirname, './setup.js');
try {
  fs.accessSync(setup_file);
} catch (e) {
  notNPM = false;
}

const execute = require('./execute');

if (
  notNPM ||
  process.env.NODE_ENV === 'production'
) {
  execute('.', 'node', setup_file);
}
