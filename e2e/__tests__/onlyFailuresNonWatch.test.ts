/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
import {cleanup, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'non-watch-mode-onlyFailures');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('onlyFailures flag works in non-watch mode', () => {
  writeFiles(DIR, {
    '__tests__/a.js': `
    test('bar', () => { expect('bar').toBe('foo'); });
    `,
    '__tests__/b.js': `
    test('foo', () => { expect('foo').toBe('foo'); });
    `,
    'package.json': JSON.stringify({
      jest: {
        testEnvironment: 'node',
      },
    }),
  });

  let stdout, stderr;

  ({stdout, stderr} = runJest(DIR));
  expect(stdout).toBe('');
  expect(stderr).toMatch('FAIL __tests__/a.js');
  expect(stderr).toMatch('PASS __tests__/b.js');

  // only the failed test should run and it should fail
  ({stdout, stderr} = runJest(DIR, ['--onlyFailures']));
  expect(stdout).toBe('');
  expect(stderr).toMatch('FAIL __tests__/a.js');
  expect(stderr).not.toMatch('__tests__/b.js');

  // fix the failing test
  const data = "test('bar 1', () => { expect('bar').toBe('bar'); })";
  fs.writeFileSync(path.join(DIR, '__tests__/a.js'), data);

  // only the failed test should run and it should pass
  ({stdout, stderr} = runJest(DIR, ['--onlyFailures']));
  expect(stdout).toBe('');
  expect(stderr).toMatch('PASS __tests__/a.js');
  expect(stderr).not.toMatch('__tests__/b.js');

  // No test should run
  ({stdout, stderr} = runJest(DIR, ['--onlyFailures']));
  expect(stdout).toBe('No failed test found.');
  expect(stderr).toBe('');
});
