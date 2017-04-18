/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

const spawnSync = require('cross-spawn').sync;
const path = require('path');

const JEST_RUNTIME = path.resolve(__dirname, '../../bin/jest-runtime.js');

const run = args =>
  spawnSync(JEST_RUNTIME, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
  });

describe('Runtime', () => {
  describe('cli', () => {
    it('fails with no path', () => {
      const expectedOutput =
        'Please provide a path to a script. (See --help for details)\n';
      expect(run([]).stdout).toBe(expectedOutput);
    });

    it('displays script output', () => {
      const scriptPath = path.resolve(__dirname, './test_root/logging.js');
      expect(run([scriptPath, '--no-cache']).stdout).toMatch('Hello, world!\n');
    });

    it('always disables automocking', () => {
      const scriptPath = path.resolve(__dirname, './test_root/logging.js');
      const output = run([
        scriptPath,
        '--no-cache',
        '--config=' +
          JSON.stringify({
            automock: true,
          }),
      ]);
      expect(output.stdout).toMatch('Hello, world!\n');
    });

    it('throws script errors', () => {
      const scriptPath = path.resolve(__dirname, './test_root/throwing.js');
      expect(run([scriptPath, '--no-cache']).stderr).toMatch(
        'Error: throwing\n',
      );
    });
  });
});
