/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

import path from 'path';
import {cleanup, writeFiles, extractSortedSummary} from '../Utils';
import os from 'os';
import runJest from '../runJest';

const DIR = path.resolve(os.tmpdir(), 'watch_mode');
const pluginPath = path.resolve(__dirname, '../MockStdinWatchPlugin');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

expect.addSnapshotSerializer({
  print: val => val.replace(/\[s\[u/g, '\n'),
  test: val => typeof val === 'string' && val.includes('[s[u'),
});

const setupFiles = input => {
  writeFiles(DIR, {
    '__tests__/bar.spec.js': `
      test('bar 1', () => { expect('bar').toBe('bar'); });
      test('bar 2', () => { expect('bar').toBe('bar'); });
    `,
    '__tests__/foo.spec.js': `
      test('foo 1', () => { expect('foo').toBe('foo'); });
      test('foo 2', () => { expect('foo').toBe('foo'); });
    `,
    'package.json': JSON.stringify({
      jest: {
        testEnvironment: 'node',
        watchPlugins: [[pluginPath, {input}]],
      },
    }),
  });
};

test('can press "p" to filter by file name', () => {
  const input = [{keys: ['p', 'b', 'a', 'r', '\r']}, {keys: ['q']}];
  setupFiles(input);

  const {status, stdout, stderr} = runJest(DIR, [
    '--no-watchman',
    '--watchAll',
  ]);
  const result = extractSortedSummary(stderr);

  expect(stdout).toMatchSnapshot();
  expect(result.summary).toMatchSnapshot();
  expect(result.rest).toMatchSnapshot();
  expect(status).toBe(0);
});

test('can press "t" to filter by test name', () => {
  const input = [{keys: ['t', '2', '\r']}, {keys: ['q']}];
  setupFiles(input);

  const {status, stdout, stderr} = runJest(DIR, [
    '--no-watchman',
    '--watchAll',
  ]);
  const result = extractSortedSummary(stderr);

  expect(stdout).toMatchSnapshot();
  expect(result.summary).toMatchSnapshot();
  expect(result.rest).toMatchSnapshot();
  expect(status).toBe(0);
});
