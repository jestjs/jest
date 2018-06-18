/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const runJest = require('../runJest');
const {cleanup} = require('../Utils');

const DIR = path.join(os.tmpdir(), 'jest-global-setup');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('globalSetup is triggered once before all test suites', () => {
  const setupPath = path.resolve(__dirname, '../global-setup/setup.js');
  const result = runJest.json('global-setup', [`--globalSetup=${setupPath}`]);
  expect(result.status).toBe(0);
  const files = fs.readdirSync(DIR);
  expect(files).toHaveLength(1);
  const setup = fs.readFileSync(path.join(DIR, files[0]), 'utf8');
  expect(setup).toBe('setup');
});

test('jest throws an error when globalSetup does not export a function', () => {
  const setupPath = path.resolve(__dirname, '../global-setup/invalid_setup.js');
  const {status, stderr} = runJest('global-setup', [
    `--globalSetup=${setupPath}`,
  ]);

  expect(status).toBe(1);
  expect(stderr).toMatch(
    `TypeError: globalSetup file must export a function at ${setupPath}`,
  );
});

test('globalSetup function gets jest config object as a parameter', () => {
  const setupPath = path.resolve(
    __dirname,
    '../global-setup/setup-with-config.js',
  );

  const testPathPattern = 'pass';

  const result = runJest('global-setup', [
    `--globalSetup=${setupPath}`,
    `--testPathPattern=${testPathPattern}`,
  ]);

  expect(result.stdout).toBe(testPathPattern);
});
