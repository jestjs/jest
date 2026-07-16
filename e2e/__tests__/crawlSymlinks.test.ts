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

const DIR = path.resolve(tmpdir(), 'crawl-symlinks-test');

beforeEach(() => {
  cleanup(DIR);

  writeFiles(DIR, {
    'package.json': JSON.stringify({
      jest: {
        testMatch: ['<rootDir>/test-files/test.js'],
      },
    }),
    'symlinked-files/test.js': `
      test('1+1', () => {
        expect(1).toBe(1);
      });
    `,
  });

  writeSymlinks(DIR, {
    'symlinked-files/test.js': 'test-files/test.js',
  });
});

afterEach(() => {
  cleanup(DIR);
});

test('Node crawler picks up symlinked files when option is set as flag', () => {
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

test('Should throw if watchman used with haste.enableSymlinks', () => {
  // it should throw both if watchman is explicitly provided and not
  const run1 = runJest(DIR, ['--haste={"enableSymlinks": true}']);
  const run2 = runJest(DIR, ['--haste={"enableSymlinks": true}', '--watchman']);

  expect(run1.exitCode).toEqual(run2.exitCode);
  expect(run1.stderr).toEqual(run2.stderr);
  expect(run1.stdout).toEqual(run2.stdout);

  const {exitCode, stderr, stdout} = run1;

  expect(stdout).toBe('');
  expect(stderr).toMatchInlineSnapshot(`
    "Validation Error:

    haste.enableSymlinks is incompatible with watchman

    Either set haste.enableSymlinks to false or do not use watchman"
  `);
  expect(exitCode).toBe(1);
});
