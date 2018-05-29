/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const path = require('path');
const os = require('os');
const {cleanup, writeFiles} = require('../Utils');
const runJest = require('../runJest');

const DIR = path.resolve(os.tmpdir(), 'log_heap_usage_test');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('logs memory usage', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `test('banana', () => expect(1).toBe(1));`,
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  const {stderr} = runJest(DIR, ['--logHeapUsage']);
  expect(stderr).toMatch(/PASS\s__tests__\/a-banana.js.*\d+ MB heap size/);
});
