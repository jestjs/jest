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

const runJest = require('../runJest');

test('config as JSON', () => {
  const result = runJest('verbose_reporter', [
    '--config=' + JSON.stringify({
      testEnvironment: 'node',
      testMatch: ['banana strawbery kiwi'],
    }),
  ]);
  const stdout = result.stdout.toString();

  expect(result.status).toBe(0);
  expect(stdout).toMatch('No tests found');
});

test('works with sane config JSON', () => {
  const result = runJest('verbose_reporter', [
    '--config=' + JSON.stringify({
      testEnvironment: 'node',
    }),
  ]);
  const stderr = result.stderr.toString();

  expect(result.status).toBe(1);
  expect(stderr).toMatch('works just fine');
});

test('watchman config option is respected over default argv', () => {
  const {stdout} = runJest('verbose_reporter', [
    '--config=' + JSON.stringify({
      testEnvironment: 'node',
      watchman: false,
    }),
    '--debug',
  ]);

  expect(stdout).toMatch('\"watchman\": false,');
});
