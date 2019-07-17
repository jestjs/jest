/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import fs from 'fs';
import {Writable} from 'stream';
import execa, {ExecaChildProcess, ExecaReturns} from 'execa';
import stripAnsi from 'strip-ansi';
import {normalizeIcons} from './Utils';

const JEST_PATH = path.resolve(__dirname, '../packages/jest-cli/bin/jest.js');

type RunJestOptions = {
  nodeOptions?: string;
  nodePath?: string;
  skipPkgJsonCheck?: boolean; // don't complain if can't find package.json
  stripAnsi?: boolean; // remove colors from stdout and stderr,
  timeout?: number; // kill the Jest process after X milliseconds
};

// return the result of the spawned process:
//  [ 'status', 'signal', 'output', 'pid', 'stdout', 'stderr',
//    'envPairs', 'options', 'args', 'file' ]
export default function runJest(
  dir: string,
  args?: Array<string>,
  options: RunJestOptions = {},
) {
  return normalizeResult(spawnJest(dir, args, options), options);
}

function spawnJest(
  dir: string,
  args?: Array<string>,
  options?: RunJestOptions,
  spawnAsync?: false,
): ExecaReturns;
function spawnJest(
  dir: string,
  args?: Array<string>,
  options?: RunJestOptions,
  spawnAsync?: true,
): ExecaChildProcess;

// Spawns Jest and returns either a Promise (if spawnAsync is true) or the completed child process
function spawnJest(
  dir: string,
  args?: Array<string>,
  options: RunJestOptions = {},
  spawnAsync: boolean = false,
): ExecaReturns | ExecaChildProcess {
  const isRelative = !path.isAbsolute(dir);

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
      global package.json, which will send Jest into infinite loop.
    `,
    );
  }
  const env = Object.assign({}, process.env, {FORCE_COLOR: '0'});

  if (options.nodeOptions) env['NODE_OPTIONS'] = options.nodeOptions;
  if (options.nodePath) env['NODE_PATH'] = options.nodePath;

  const spawnArgs = [JEST_PATH, ...(args || [])];
  const spawnOptions = {
    cwd: dir,
    env,
    reject: false,
    timeout: options.timeout || 0,
  };

  return (spawnAsync ? execa : execa.sync)(
    process.execPath,
    spawnArgs,
    spawnOptions,
  );
}

type RunJestResult = ExecaReturns & {
  status?: number;
  code?: number;
  json?: (
    dir: string,
    args: Array<string> | undefined,
    options: RunJestOptions,
  ) => RunJestResult;
};

function normalizeResult(result: RunJestResult, options: RunJestOptions) {
  // For compat with cross-spawn
  result.status = result.code;

  result.stdout = normalizeIcons(result.stdout);
  if (options.stripAnsi) result.stdout = stripAnsi(result.stdout);
  result.stderr = normalizeIcons(result.stderr);
  if (options.stripAnsi) result.stderr = stripAnsi(result.stderr);

  return result;
}

// Runs `jest` with `--json` option and adds `json` property to the result obj.
//   'success', 'startTime', 'numTotalTests', 'numTotalTestSuites',
//   'numRuntimeErrorTestSuites', 'numPassedTests', 'numFailedTests',
//   'numPendingTests', 'testResults'
export const json = function(
  dir: string,
  args: Array<string> | undefined,
  options: RunJestOptions = {},
): RunJestResult {
  args = [...(args || []), '--json'];
  const result = runJest(dir, args, options);
  try {
    result.json = JSON.parse(result.stdout || '');
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
export const until = async function(
  dir: string,
  args: Array<string> | undefined,
  text: string,
  options: RunJestOptions = {},
) {
  const jestPromise = spawnJest(dir, args, {timeout: 30000, ...options}, true);

  jestPromise.stderr!.pipe(
    new Writable({
      write(chunk, _encoding, callback) {
        const output = chunk.toString('utf8');

        if (output.includes(text)) {
          jestPromise.kill();
        }

        callback();
      },
    }),
  );

  return normalizeResult(await jestPromise, options);
};
