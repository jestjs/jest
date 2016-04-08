/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';
let executable = './setup.sh';
if (
  process.env.NODE_ENV !== 'production'
) {
  if (process.platform === 'win32') {
    executable = 'setup.bat';
  }
  const spawn = require('child_process').spawn;
  spawn(executable, [], {stdio:'inherit'});
}
