/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {cleanup, extractSummaries, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'watch-mode-update-snapshot');
const pluginPath = path.resolve(__dirname, '../MockStdinWatchPlugin');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

expect.addSnapshotSerializer({
  print: val => (val as string).replaceAll('[s[u', '\n'),
  test: val => typeof val === 'string' && val.includes('[s[u'),
});

const setupFiles = (input: Array<{keys: Array<string>}>) => {
  writeFiles(DIR, {
    '__tests__/__snapshots__/bar.spec.js.snap': `// Jest Snapshot v1, https://jestjs.io/docs/snapshot-testing

exports[\`bar 1\`] = \`"foo"\`;
    `,
    '__tests__/bar.spec.js': `
      test('bar', () => { expect('bar').toMatchSnapshot(); });
    `,
    'package.json': JSON.stringify({
      jest: {
        testEnvironment: 'node',
        watchPlugins: [[pluginPath, {input}]],
      },
    }),
  });
};

test('can press "u" to update snapshots', () => {
  const input = [{keys: ['u']}, {keys: ['q']}];
  setupFiles(input);

  const {exitCode, stderr} = runJest(DIR, ['--no-watchman', '--watchAll']);
  const results = extractSummaries(stderr);
  expect(results).toHaveLength(2);
  for (const {rest, summary} of results) {
    expect(rest).toMatchSnapshot('test results');
    expect(summary).toMatchSnapshot('test summary');
  }
  expect(exitCode).toBe(0);
});
