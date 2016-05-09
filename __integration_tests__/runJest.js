/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const spawnSync = require('child_process').spawnSync;
const path = require('path');
const JEST_PATH = path.resolve(__dirname, '../packages/jest-cli/bin/jest.js');

// return the result of the spawned proccess:
//  [ 'status', 'signal', 'output', 'pid', 'stdout', 'stderr',
//    'envPairs', 'options', 'args', 'file' ]
module.exports = function runJest(dir, args) {
  return spawnSync(JEST_PATH, args || [], {
    cwd: path.resolve(__dirname, dir),
  });
};
