/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

const {spawnSync} = require('child_process');
const path = require('path');
const skipOnWindows = require('skipOnWindows');

const JEST_RUNTIME = path.resolve(__dirname, '../../bin/jest-repl.js');

describe('Repl', () => {
  skipOnWindows.suite();

  describe('cli', () => {
    it('runs without errors', () => {
      const output = spawnSync(JEST_RUNTIME, [], {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: process.env,
      });
      expect(output.stdout.trim()).toMatch(/›/);
    });
  });
});
