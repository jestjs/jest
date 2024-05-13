/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as path from 'path';
import {Writable} from 'stream';
import dedent from 'dedent';
import execa = require('execa');
import * as fs from 'graceful-fs';
import stripAnsi = require('strip-ansi');
import {TestPathPatterns} from '@jest/pattern';
import type {FormattedTestResults} from '@jest/test-result';
import {normalizeIcons} from '@jest/test-utils';
import type {Config} from '@jest/types';
import {ErrorWithStack} from 'jest-util';

const JEST_PATH = path.resolve(__dirname, '../packages/jest-cli/bin/jest.js');

type RunJestOptions = {
  keepTrailingNewline?: boolean; // keep final newline in output from stdout and stderr
  nodeOptions?: string;
  nodePath?: string;
  skipPkgJsonCheck?: boolean; // don't complain if can't find package.json
  stripAnsi?: boolean; // remove colors from stdout and stderr,
  timeout?: number; // kill the Jest process after X milliseconds
  env?: NodeJS.ProcessEnv;
};

// return the result of the spawned process:
//  [ 'status', 'signal', 'output', 'pid', 'stdout', 'stderr',
//    'envPairs', 'options', 'args', 'file' ]
export default function runJest(
  dir: string,
  args?: Array<string>,
  options: RunJestOptions = {},
): RunJestResult {
  const result = spawnJest(dir, args, options);

  if (result.killed) {
    throw new Error(dedent`
      Spawned process was killed.
      DETAILS:
        ${JSON.stringify(result, null, 2)}
    `);
  }

  return normalizeStdoutAndStderrOnResult(result, options);
}

function spawnJest(
  dir: string,
  args?: Array<string>,
  options?: RunJestOptions,
  spawnAsync?: false,
): RunJestResult;
function spawnJest(
  dir: string,
  args?: Array<string>,
  options?: RunJestOptions,
  spawnAsync?: true,
): execa.ExecaChildProcess;

// Spawns Jest and returns either a Promise (if spawnAsync is true) or the completed child process
function spawnJest(
  dir: string,
  args: Array<string> = [],
  options: RunJestOptions = {},
  spawnAsync = false,
): execa.ExecaSyncReturnValue | execa.ExecaChildProcess {
  const isRelative = !path.isAbsolute(dir);

  if (isRelative) {
    dir = path.resolve(__dirname, dir);
  }

  const localPackageJson = path.resolve(dir, 'package.json');
  if (!options.skipPkgJsonCheck && !fs.existsSync(localPackageJson)) {
    throw new Error(dedent`
      Make sure you have a local package.json file at
        "${localPackageJson}".
      Otherwise Jest will try to traverse the directory tree and find the global package.json, which will send Jest into infinite loop.
    `);
  }
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    FORCE_COLOR: '0',
    NO_COLOR: '1',
    ...options.env,
  };

  if (options.nodeOptions) env['NODE_OPTIONS'] = options.nodeOptions;
  if (options.nodePath) env['NODE_PATH'] = options.nodePath;

  const spawnArgs = [JEST_PATH, ...args];
  const spawnOptions: execa.CommonOptions<string> = {
    cwd: dir,
    env,
    reject: false,
    stripFinalNewline: !options.keepTrailingNewline,
    timeout: options.timeout || 0,
  };

  return (spawnAsync ? execa : execa.sync)(
    process.execPath,
    spawnArgs,
    spawnOptions,
  );
}

export type RunJestResult = execa.ExecaReturnValue;

export interface RunJestJsonResult extends RunJestResult {
  json: FormattedTestResults;
}

function normalizeStreamString(
  stream: string,
  options: RunJestOptions,
): string {
  if (options.stripAnsi) stream = stripAnsi(stream);
  stream = normalizeIcons(stream);

  return stream;
}

function normalizeStdoutAndStderrOnResult(
  result: RunJestResult,
  options: RunJestOptions,
): RunJestResult {
  const stdout = normalizeStreamString(result.stdout, options);
  const stderr = normalizeStreamString(result.stderr, options);

  return {...result, stderr, stdout};
}

// Runs `jest` with `--json` option and adds `json` property to the result obj.
//   'success', 'startTime', 'numTotalTests', 'numTotalTestSuites',
//   'numRuntimeErrorTestSuites', 'numPassedTests', 'numFailedTests',
//   'numPendingTests', 'testResults'
export const json = function (
  dir: string,
  args?: Array<string>,
  options: RunJestOptions = {},
): RunJestJsonResult {
  args = [...(args || []), '--json'];
  const result = runJest(dir, args, options);
  try {
    return {
      ...result,
      json: JSON.parse(result.stdout),
    };
  } catch (error: any) {
    throw new Error(dedent`
      Can't parse JSON.
      ERROR: ${error.name} ${error.message}
      STDOUT: ${result.stdout}
      STDERR: ${result.stderr}
    `);
  }
};

type StdErrAndOutString = {stderr: string; stdout: string};
type ConditionFunction = (arg: StdErrAndOutString) => boolean;
type CheckerFunction = (arg: StdErrAndOutString) => void;

// Runs `jest` continuously (watch mode) and allows the caller to wait for
// conditions on stdout and stderr and to end the process.
export const runContinuous = function (
  dir: string,
  args?: Array<string>,
  options: RunJestOptions = {},
) {
  const jestPromise = spawnJest(dir, args, {timeout: 30_000, ...options}, true);

  let stderr = '';
  let stdout = '';
  const pending = new Set<CheckerFunction>();
  const pendingRejection = new WeakMap<CheckerFunction, () => void>();

  jestPromise.addListener('exit', () => {
    for (const fn of pending) {
      const reject = pendingRejection.get(fn);

      if (reject) {
        console.log('stdout', normalizeStreamString(stdout, options));
        console.log('stderr', normalizeStreamString(stderr, options));

        reject();
      }
    }
  });

  const dispatch = () => {
    for (const fn of pending) {
      fn({stderr, stdout});
    }
  };

  jestPromise.stdout!.pipe(
    new Writable({
      write(chunk, _encoding, callback) {
        stdout += chunk.toString('utf8');
        dispatch();
        callback();
      },
    }),
  );

  jestPromise.stderr!.pipe(
    new Writable({
      write(chunk, _encoding, callback) {
        stderr += chunk.toString('utf8');
        dispatch();
        callback();
      },
    }),
  );

  const continuousRun = {
    async end() {
      jestPromise.kill();

      const result = await jestPromise;

      // Not sure why we have to assign here... The ones on `result` are empty strings
      result.stdout = stdout;
      result.stderr = stderr;

      return normalizeStdoutAndStderrOnResult(result, options);
    },

    getCurrentOutput(): StdErrAndOutString {
      return {stderr, stdout};
    },

    getInput() {
      return jestPromise.stdin;
    },

    async waitUntil(fn: ConditionFunction) {
      await new Promise<void>((resolve, reject) => {
        const check: CheckerFunction = state => {
          if (fn(state)) {
            pending.delete(check);
            pendingRejection.delete(check);
            resolve();
          }
        };
        const error = new ErrorWithStack(
          'Process exited',
          continuousRun.waitUntil,
        );
        pendingRejection.set(check, () => reject(error));
        pending.add(check);
      });
    },
  };

  return continuousRun;
};

// return type matches output of logDebugMessages
export function getConfig(
  dir: string,
  args: Array<string> = [],
  options?: RunJestOptions,
): {
  globalConfig: Config.GlobalConfig;
  configs: Array<Config.ProjectConfig>;
  version: string;
} {
  const {exitCode, stdout, stderr} = runJest(
    dir,
    [...args, '--show-config'],
    options,
  );

  try {
    expect(exitCode).toBe(0);
  } catch (error) {
    console.error('Exit code is not 0', {stderr, stdout});
    throw error;
  }

  const {testPathPatterns, ...globalConfig} = JSON.parse(stdout);

  return {
    ...globalConfig,
    testPathPatterns: new TestPathPatterns(testPathPatterns),
  };
}
