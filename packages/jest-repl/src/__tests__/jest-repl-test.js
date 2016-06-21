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

const JEST_RUNTIME = path.resolve(__dirname, '../../bin/jest-repl.js');

jest.disableAutomock();

describe('Repl', () => {
  describe('cli', () => {
    it('runs without errors', () => {
      const output = spawnSync(JEST_RUNTIME, [], {
        encoding: 'utf8',
        cwd: process.cwd(),
        env: process.env,
      });
      const expectedRegex = new RegExp([
        'Using Jest Runtime v([0-9]+.[0-9]+.[0-9]+), ',
        'Jest REPL v([0-9]+.[0-9]+.[0-9]+)',
      ].join(''));
      expect(output.stdout.trim()).toMatch(expectedRegex);
    });
  });
});
