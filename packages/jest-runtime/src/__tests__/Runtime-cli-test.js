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

const spawnSync = require('child_process').spawnSync;
const path = require('path');

const JEST_RUNTIME = path.resolve(__dirname, '../../bin/jest-runtime.js');

jest.disableAutomock();

describe('Runtime', () => {
  describe('cli', () => {
    it('fails with no path', () => {
      const expectedOutput =
        'Please provide a path to a script. (See --help for details)';
      const output = spawnSync(JEST_RUNTIME, [], {
        encoding: 'utf8',
        cwd: process.cwd(),
        env: process.env,
      });
      expect(output.stdout.trim()).toBe(expectedOutput);
    });

    it('displays script output', () => {
      const scriptPath = path.resolve(__dirname, './test_root/logging.js');
      const output = spawnSync(JEST_RUNTIME, [scriptPath], {
        encoding: 'utf8',
        cwd: process.cwd(),
        env: process.env,
      });
      expect(output.stdout.trim()).toMatch('Hello, world!');
    });

    it('throws script errors', () => {
      const scriptPath = path.resolve(__dirname, './test_root/throwing.js');
      const output = spawnSync(JEST_RUNTIME, [scriptPath], {
        encoding: 'utf8',
        cwd: process.cwd(),
        env: process.env,
      });
      expect(output.stderr.trim()).toMatch('Error: throwing');
    });
  });
});
