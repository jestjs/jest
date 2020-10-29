/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {tmpdir} from 'os';
import * as path from 'path';

import runJest from '../runJest';
import {cleanup, writeFiles, writeSymlinks} from '../Utils';

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

test('Node crawler picks up symlinked files when option is set as flag', () => {
  // Symlinks are only enabled on windows with developer mode.
  // https://blogs.windows.com/windowsdeveloper/2016/12/02/symlinks-windows-10/
  if (process.platform === 'win32') {
    return;
  }

  init();
  const {stdout, stderr, exitCode} = runJest(DIR, [
    '--haste={"enableSymlinks": true}',
  ]);

  expect(stdout).toEqual('');
  expect(stderr).toContain('Test Suites: 1 passed, 1 total');
  expect(exitCode).toEqual(0);
});

test('Node crawler does not pick up symlinked files by default', () => {
  init();
  const {stdout, stderr, exitCode} = runJest(DIR, []);
  expect(stdout).toContain('No tests found, exiting with code 1');
  expect(stderr).toEqual('');
  expect(exitCode).toEqual(1);
});

test('Warns if --enableSymlinks passed but not set in .watchmanconfig', () => {
  // Symlinks are only enabled on windows with developer mode.
  // https://blogs.windows.com/windowsdeveloper/2016/12/02/symlinks-windows-10/
  if (process.platform === 'win32') {
    return;
  }

  init({'.watchmanconfig': ''});

  const {stdout, stderr, exitCode} = runJest(DIR, [
    '--haste={"enableSymlinks": true}',
  ]);

  expect(stdout).toEqual(
    `jest-haste-map: --enableSymlinks was passed but symlink ` +
      `crawling is not enabled in .watchmanconfig.
  To enable symlink crawling in .watchmanconfig set \"watch_symlinks\": true.`,
  );

  expect(stderr).toContain('Test Suites: 1 passed, 1 total');
  expect(exitCode).toEqual(0);
});

test('Warns if watch_symlinks true in .watchmanconfig but not passed', () => {
  // Symlinks are only enabled on windows with developer mode.
  // https://blogs.windows.com/windowsdeveloper/2016/12/02/symlinks-windows-10/
  if (process.platform === 'win32') {
    return;
  }

  init({'.watchmanconfig': JSON.stringify({watch_symlinks: true})});

  const {stdout, stderr, exitCode} = runJest(DIR, []);

  expect(stdout).toContain(
    'jest-haste-map: watch_symlinks is enabled in .watchmanconfig but ' +
      '--enableSymlinks was not passed to Jest as a flag.',
  );
  expect(stdout).toContain('No tests found, exiting with code 1');
  expect(stderr).toEqual('');

  expect(exitCode).toEqual(1);
});
