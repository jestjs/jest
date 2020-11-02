/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
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
});

afterEach(() => {
  cleanup(DIR);
});

function init(
  extraFiles: {
    [filename: string]: string;
  } = {},
) {
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
    ...extraFiles,
  });

  writeSymlinks(DIR, {
    'symlinked-files/test.js': 'test-files/test.js',
  });
}

const noWatchman = '--no-watchman';
test('Node crawler picks up symlinked files when option is set as flag', () => {
  // Symlinks are only enabled on windows with developer mode.
  // https://blogs.windows.com/windowsdeveloper/2016/12/02/symlinks-windows-10/
  if (process.platform === 'win32') {
    return;
  }

  init();
  const {stdout, stderr, exitCode} = runJest(DIR, [
    '--haste={"enableSymlinks": true}',
    noWatchman,
  ]);

  expect(stdout).toEqual('');
  expect(stderr).toContain('Test Suites: 1 passed, 1 total');
  expect(exitCode).toEqual(0);
});

test('Node crawler does not pick up symlinked files by default', () => {
  init();
  const {stdout, stderr, exitCode} = runJest(DIR, [noWatchman]);
  expect(stdout).toContain('No tests found, exiting with code 1');
  expect(stderr).toEqual('');
  expect(exitCode).toEqual(1);
});
