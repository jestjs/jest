/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

import path from 'path';
import {cleanup, extractSummaries, writeFiles} from '../Utils';
import os from 'os';
import runJest from '../runJest';

const DIR = path.resolve(os.tmpdir(), 'watch_mode_only_failed');
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
      test('bar 1', () => { expect('bar').toBe('foo'); });
    `,
    '__tests__/foo.spec.js': `
      test('foo 1', () => { expect('foo').toBe('foo'); });
    `,
    'package.json': JSON.stringify({
      jest: {
        testEnvironment: 'node',
        watchPlugins: [[pluginPath, {input}]],
      },
    }),
  });
};

test('can press "f" to run only failed tests', () => {
  const input = [{keys: ['f']}, {keys: ['q']}];
  setupFiles(input);

  const {status, stderr} = runJest(DIR, ['--no-watchman', '--watchAll']);
  const results = extractSummaries(stderr);

  expect(results).toHaveLength(2);
  results.forEach(({rest, summary}) => {
    expect(rest).toMatchSnapshot('test results');
    expect(summary).toMatchSnapshot('test summary');
  });
  expect(status).toBe(0);
});
