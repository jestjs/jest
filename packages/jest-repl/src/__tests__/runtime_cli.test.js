/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {sync as spawnSync} from 'execa';

const JEST_RUNTIME = require.resolve('../../bin/jest-runtime-cli.js');

const timeout = 10_000;

const run = args =>
  spawnSync(JEST_RUNTIME, args, {
    cwd: process.cwd(),
    env: process.env,
    reject: false,
    timeout: timeout - 500,
  });

describe('Runtime CLI', () => {
  beforeAll(() => {
    jest.retryTimes(3);
    jest.setTimeout(timeout);
  });

  it('fails with no path', () => {
    const expectedOutput =
      'Please provide a path to a script. (See --help for details)';
    expect(run([]).stdout).toBe(expectedOutput);
  });

  it('displays script output', () => {
    const scriptPath = require.resolve('./test_root/logging.js');
    expect(run([scriptPath, '--no-cache']).stdout).toMatch('Hello, world!');
  });

  it('always disables automocking', () => {
    const scriptPath = require.resolve('./test_root/logging.js');
    const output = run([
      scriptPath,
      '--no-cache',
      `--config=${JSON.stringify({automock: true})}`,
    ]);
    expect(output.stdout).toMatch('Hello, world!');
  });

  it('throws script errors', () => {
    const scriptPath = require.resolve('./test_root/throwing.js');
    expect(run([scriptPath, '--no-cache']).stderr).toMatch('Error: throwing');
  });
});
