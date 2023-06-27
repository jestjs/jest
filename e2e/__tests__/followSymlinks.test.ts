/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {tmpdir} from 'os';
import * as path from 'path';
import {cleanup, writeFiles, writeSymlinks} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'follow-symlinks-test');

beforeEach(() => {
  cleanup(DIR);

  writeFiles(DIR, {
    'package.json': JSON.stringify({
      jest: {
        testMatch: ['<rootDir>/follow-symlinks/**'],
      },
    }),
    'symlinked-files/test.js': `
      test('1+1', () => {
        expect(1).toBe(1);
      });
    `,
  });

  writeSymlinks(DIR, {
    'symlinked-files': 'follow-symlinks',
  });
});

afterEach(() => {
  cleanup(DIR);
});

test('Node crawler picks up the file referenced by the link when option is set as flag', () => {
  // Symlinks are only enabled on windows with developer mode.
  // https://blogs.windows.com/windowsdeveloper/2016/12/02/symlinks-windows-10/
  if (process.platform === 'win32') {
    return;
  }

  const {stdout, stderr, exitCode} = runJest(DIR, [
    '--haste={"enableSymlinks": true}',
    '--no-watchman',
  ]);

  expect(stdout).toBe('');
  expect(stderr).toContain('Test Suites: 1 passed, 1 total');
  expect(exitCode).toBe(0);
});

test('Node crawler does not pick up symlinked files by default', () => {
  const {stdout, stderr, exitCode} = runJest(DIR, ['--no-watchman']);
  expect(stdout).toContain('No tests found, exiting with code 1');
  expect(stderr).toBe('');
  expect(exitCode).toBe(1);
});
