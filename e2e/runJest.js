/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const path = require('path');
const fs = require('fs');
const execa = require('execa');
const {Writable} = require('readable-stream');
const {normalizeIcons} = require('./Utils');

const {sync: spawnSync} = execa;

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
  if (!options.skipPkgJsonCheck && !fs.existsSync(localPackageJson)) {
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
        FORCE_COLOR: 0,
        NODE_PATH: options.nodePath,
      })
    : process.env;

  const result = spawnSync(JEST_PATH, args || [], {
    cwd: dir,
    env,
    reject: false,
  });

  // For compat with cross-spawn
  result.status = result.code;

  result.stdout = normalizeIcons(result.stdout);
  result.stderr = normalizeIcons(result.stderr);

  return result;
}

// Runs `jest` with `--json` option and adds `json` property to the result obj.
//   'success', 'startTime', 'numTotalTests', 'numTotalTestSuites',
//   'numRuntimeErrorTestSuites', 'numPassedTests', 'numFailedTests',
//   'numPendingTests', 'testResults'
runJest.json = function(dir: string, args?: Array<string>, ...rest) {
  args = [...(args || []), '--json'];
  const result = runJest(dir, args, ...rest);
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

// Runs `jest` until a given output is achieved, then kills it with `SIGTERM`
runJest.until = async function(
  dir: string,
  args?: Array<string>,
  text: string,
  options: RunJestOptions = {},
) {
  const isRelative = dir[0] !== '/';

  if (isRelative) {
    dir = path.resolve(__dirname, dir);
  }

  const localPackageJson = path.resolve(dir, 'package.json');
  if (!options.skipPkgJsonCheck && !fs.existsSync(localPackageJson)) {
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
        FORCE_COLOR: 0,
        NODE_PATH: options.nodePath,
      })
    : process.env;

  const jestPromise = execa(JEST_PATH, args || [], {
    cwd: dir,
    env,
    reject: false,
  });

  jestPromise.stderr.pipe(
    new Writable({
      write(chunk, encoding, callback) {
        const output = chunk.toString('utf8');

        if (output.includes(text)) {
          jestPromise.kill();
        }

        callback();
      },
    }),
  );

  const result = await jestPromise;

  // For compat with cross-spawn
  result.status = result.code;

  result.stdout = normalizeIcons(result.stdout);
  result.stderr = normalizeIcons(result.stderr);

  return result;
};

module.exports = runJest;
