/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const {fileExists} = require('./utils');
const path = require('path');
const spawnSync = require('child_process').spawnSync;

const JEST_PATH = path.resolve(__dirname, '../packages/jest-cli/bin/jest.js');

// return the result of the spawned process:
//  [ 'status', 'signal', 'output', 'pid', 'stdout', 'stderr',
//    'envPairs', 'options', 'args', 'file' ]
function runJest(dir, args) {
  const isRelative = dir[0] !== '/';

  if (isRelative) {
    dir = path.resolve(__dirname, dir);
  }

  const localPackageJson = path.resolve(dir, 'package.json');
  if (!fileExists(localPackageJson)) {
    throw new Error(`
      Make sure you have a local package.json file at
        "${localPackageJson}".
      Otherwise Jest will try to traverse the directory tree and find the
      the global package.json, which will send Jest into infinite loop.
    `);
  }

  const result = spawnSync(JEST_PATH, args || [], {
    cwd: dir,
  });

  result.stdout = result.stdout && result.stdout.toString();
  result.stderr = result.stderr && result.stderr.toString();

  return result;
}

// Runs `jest` with `--json` option and adds `json` property to the result obj.
//   'success', 'startTime', 'numTotalTests', 'numTotalTestSuites',
//   'numRuntimeErrorTestSuites', 'numPassedTests', 'numFailedTests',
//   'numPendingTests', 'testResults'
runJest.json = function(dir, args) {
  args = Array.prototype.concat(args || [], '--json');
  const result = runJest(dir, args);
  try {
    result.json = JSON.parse((result.stdout || '').toString());
  } catch (e) {
    throw new Error(`
      Can't parse JSON.
      ERROR: ${e.name} ${e.message}
      STDOUT: ${result.stdout}
      STDERR: ${result.stderr}
    `);
  }
  return result;
};

module.exports = runJest;
