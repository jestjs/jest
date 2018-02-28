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
