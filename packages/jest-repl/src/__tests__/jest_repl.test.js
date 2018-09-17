/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

const {spawnSync} = require('child_process');
const path = require('path');
const ConditionalTest = require('../../../../scripts/ConditionalTest');

const JEST_RUNTIME = path.resolve(__dirname, '../../bin/jest-repl.js');

describe('Repl', () => {
  ConditionalTest.skipSuiteOnWindows();

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
