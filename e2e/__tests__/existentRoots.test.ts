/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {tmpdir} from 'os';
import {cleanup, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'existent-roots');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

function writeConfig(rootDir: string, roots?: Array<string>) {
  const config = {rootDir, roots};
  const testFiles = {
    'jest.config.js': `
      module.exports = ${JSON.stringify(config, null, 2)};
    `,
  };

  writeFiles(DIR, {
    ...testFiles,
    'package.json': '{}',
  });
}

test('error when rootDir does not exist', () => {
  const fakeRootDir = path.join(DIR, 'foobar');
  writeConfig(fakeRootDir);

  const {exitCode, stderr} = runJest(DIR);

  expect(exitCode).toBe(1);
  expect(stderr).toContain(
    `Directory ${fakeRootDir} in the rootDir option was not found.`,
  );
});

test('error when rootDir is a file', () => {
  const fakeRootDir = path.join(DIR, 'jest.config.js');
  writeConfig(fakeRootDir);

  const {exitCode, stderr} = runJest(DIR);

  expect(exitCode).toBe(1);
  expect(stderr).toContain(
    `${fakeRootDir} in the rootDir option is not a directory.`,
  );
});

test('error when roots directory does not exist', () => {
  const fakeRootDir = path.join(DIR, 'foobar');
  writeConfig(DIR, ['<rootDir>', fakeRootDir]);

  const {exitCode, stderr} = runJest(DIR);

  expect(exitCode).toBe(1);
  expect(stderr).toContain(
    `Directory ${fakeRootDir} in the roots[1] option was not found.`,
  );
});

test('error when roots is a file', () => {
  const fakeRootDir = path.join(DIR, 'jest.config.js');
  writeConfig(DIR, ['<rootDir>', fakeRootDir]);

  const {exitCode, stderr} = runJest(DIR);

  expect(exitCode).toBe(1);
  expect(stderr).toContain(
    `${fakeRootDir} in the roots[1] option is not a directory.`,
  );
});
