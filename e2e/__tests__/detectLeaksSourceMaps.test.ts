/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {cleanup, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'jest_detect_leaks_source_maps_test');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

// Maps are only read and parsed when a stack is formatted, so a leak on that
// path hides from any suite whose tests never throw.
test('formatting a mapped stack does not retain the environment', () => {
  const readsAMappedStack = `
    const {boom} = require('../boom');

    test('reads a mapped stack', () => {
      let stack = '';
      try {
        boom();
      } catch (error) {
        stack = error.stack;
      }
      expect(stack).toContain('boom');
    });
  `;

  writeFiles(DIR, {
    '__tests__/a.test.js': readsAMappedStack,
    '__tests__/b.test.js': readsAMappedStack,
    'boom.js': `
      module.exports.boom = () => {
        throw new Error('boom');
      };
    `,
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  const {exitCode, stderr} = runJest(DIR, ['--detect-leaks', '--runInBand']);

  // A leak is reported as a failed suite, so the exit code is what says the
  // environment was collectable.
  expect(stderr).toMatch(/PASS\s__tests__\/a.test.js/);
  expect(stderr).toMatch(/PASS\s__tests__\/b.test.js/);
  expect(exitCode).toBe(0);
});
