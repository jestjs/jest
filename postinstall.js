/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const execute = require('./execute');
const fs = require('fs');
const path = require('path');

const getSetupFile = () => {
  try {
    const setupFile = path.resolve(__dirname, './setup.js');
    fs.accessSync(setupFile, fs.R_OK);
    return setupFile;
  } catch (e) {
    return null;
  }
};

const setupFile = getSetupFile();
if (setupFile) {
  execute('.', 'node', setupFile);
}
