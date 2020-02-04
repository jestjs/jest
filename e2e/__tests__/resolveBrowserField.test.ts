/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {cleanup, writeFiles, writeSymlinks} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'resolve-browser-field-test');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('preserves module identity for symlinks when using browser field resolution', () => {
  writeFiles(DIR, {
    'packages/needs-preserved-id/package.json': JSON.stringify({
      name: 'needs-preserved-id',
    }),
    'packages/needs-preserved-id/index.js': `
      console.log("needs-preserved-id executed");
      module.exports = {};
    `,
    'packages/has-browser-field/package.json': JSON.stringify({
      name: 'has-browser-field',
      browser: 'browser.js',
    }),
    'packages/has-browser-field/browser.js': `
      module.exports = require("needs-preserved-id");
    `,
    'package.json': JSON.stringify({
      jest: {
        testMatch: ['<rootDir>/test-files/test.js'],
        browser: true,
      },
    }),
    'test-files/test.js': `
      const id1 = require("needs-preserved-id");
      const id2 = require("has-browser-field");

      test("module should have reference equality", () => {
        expect(id1).toBe(id2);
      });
    `,
  });

  writeSymlinks(DIR, {
    'packages/needs-preserved-id': 'node_modules/needs-preserved-id',
    'packages/has-browser-field': 'node_modules/has-browser-field',
  });

  writeSymlinks(DIR, {
    'packages/needs-preserved-id':
      'packages/has-browser-field/node_modules/needs-preserved-id',
  });

  const {stdout, stderr, exitCode} = runJest(DIR, ['--no-watchman']);
  expect(stderr).toContain('Test Suites: 1 passed, 1 total');
  expect(stdout).toMatchInlineSnapshot(`
    "  console.log packages/needs-preserved-id/index.js:2
        needs-preserved-id executed
    "
  `);
  expect(exitCode).toEqual(0);
});
