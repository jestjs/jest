/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const path = require('path');
const os = require('os');
const skipOnWindows = require('../../scripts/skip_on_windows');
const {cleanup, writeFiles} = require('../utils');
const runJest = require('../runJest');

const DIR = path.resolve(os.tmpdir(), 'log_heap_usage_test');

skipOnWindows.suite();

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
