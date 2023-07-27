/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {cleanup, runYarnInstall, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(
  __dirname,
  '../to-match-inline-snapshot-with-prettier-3',
);
const TESTS_DIR = path.resolve(DIR, '__tests__');
const JEST_CONFIG_PATH = path.resolve(DIR, 'jest.config.js');

beforeAll(() => {
  runYarnInstall(DIR);
});
beforeEach(() => {
  cleanup(TESTS_DIR);
  cleanup(JEST_CONFIG_PATH);
});
afterAll(() => {
  cleanup(TESTS_DIR);
  cleanup(JEST_CONFIG_PATH);
});

test('throws correct error', () => {
  writeFiles(DIR, {
    'jest.config.js': `
        module.exports = {prettierPath: require.resolve('prettier')};
      `,
  });
  writeFiles(TESTS_DIR, {
    'test.js': `
        test('snapshots', () => {
          expect(3).toMatchInlineSnapshot();
        });
      `,
  });
  const {stderr, exitCode} = runJest(DIR, ['--ci=false']);
  expect(stderr).toContain(
    'Jest: Inline Snapshots are not supported when using Prettier 3.0.0 or above.',
  );
  expect(exitCode).toBe(1);
});

test('supports passing `null` as `prettierPath`', () => {
  writeFiles(DIR, {
    'jest.config.js': `
        module.exports = {prettierPath: null};
      `,
  });
  writeFiles(TESTS_DIR, {
    'test.js': `
        test('snapshots', () => {
          expect(3).toMatchInlineSnapshot();
        });
      `,
  });
  const {stderr, exitCode} = runJest(DIR, ['--ci=false']);
  expect(stderr).toContain('Snapshots:   1 written, 1 total');
  expect(exitCode).toBe(0);
});

test('supports passing `prettier-2` as `prettierPath`', () => {
  writeFiles(DIR, {
    'jest.config.js': `
        module.exports = {prettierPath: require.resolve('prettier-2')};
      `,
  });
  writeFiles(TESTS_DIR, {
    'test.js': `
        test('snapshots', () => {
          expect(3).toMatchInlineSnapshot();
        });
      `,
  });
  const {stderr, exitCode} = runJest(DIR, ['--ci=false']);
  expect(stderr).toContain('Snapshots:   1 written, 1 total');
  expect(exitCode).toBe(0);
});
