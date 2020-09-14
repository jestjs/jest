/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

import {spawnSync} from 'child_process';
import path from 'path';

const JEST_RUNTIME = path.resolve(__dirname, '../../bin/jest-repl.js');

describe('Repl', () => {
  describe('cli', () => {
    it('runs without errors', () => {
      let command = JEST_RUNTIME;
      const args = [];

      // Windows can't handle hashbangs, so is the best we can do
      if (process.platform === 'win32') {
        args.push(command);
        command = 'node';
      }

      const output = spawnSync(command, args, {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: process.env,
      });
      expect(output.stdout.trim()).toMatch(/›/);
    });
  });
});
