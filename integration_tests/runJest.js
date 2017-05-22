/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const path = require('path');
const {sync: spawnSync} = require('cross-spawn');
const {fileExists} = require('./utils');

const JEST_PATH = path.resolve(__dirname, '../packages/jest-cli/bin/jest.js');

type RunJestOptions = {
  nodePath?: string,
  skipPkgJsonCheck?: boolean, // don't complain if can't find package.json
};

// return the result of the spawned process:
//  [ 'status', 'signal', 'output', 'pid', 'stdout', 'stderr',
//    'envPairs', 'options', 'args', 'file' ]
function runJest(
  dir: string,
  args?: Array<string>,
  options: RunJestOptions = {},
) {
  const isRelative = dir[0] !== '/';

  if (isRelative) {
    dir = path.resolve(__dirname, dir);
  }

  const localPackageJson = path.resolve(dir, 'package.json');
  if (!options.skipPkgJsonCheck && !fileExists(localPackageJson)) {
    throw new Error(
      `
      Make sure you have a local package.json file at
        "${localPackageJson}".
      Otherwise Jest will try to traverse the directory tree and find the
      the global package.json, which will send Jest into infinite loop.
    `,
    );
  }

  const env = options.nodePath
    ? Object.assign({}, process.env, {
        NODE_PATH: options.nodePath,
      })
    : process.env;
  const result = spawnSync(JEST_PATH, args || [], {
    cwd: dir,
    env,
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
    throw new Error(
      `
      Can't parse JSON.
      ERROR: ${e.name} ${e.message}
      STDOUT: ${result.stdout}
      STDERR: ${result.stderr}
    `,
    );
  }
  return result;
};

module.exports = runJest;
