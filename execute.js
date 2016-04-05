/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const path = require('path');
const spawnSync = require('child_process').spawnSync;

module.exports = (relativeCWD, executable, params) => {
  const options = {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, relativeCWD),
  };
  spawnSync(executable, params.split(' '), options);
};
