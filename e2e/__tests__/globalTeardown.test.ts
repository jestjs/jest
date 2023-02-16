/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
import {createDirectory} from 'jest-util';
import {cleanup, runYarnInstall} from '../Utils';
import runJest, {json as runWithJson} from '../runJest';

const DIR = path.join(tmpdir(), 'jest-global-teardown');
const project1DIR = path.join(tmpdir(), 'jest-global-teardown-project-1');
const project2DIR = path.join(tmpdir(), 'jest-global-teardown-project-2');
const e2eDir = path.resolve(__dirname, '../global-teardown');
const esmTmpDir = path.join(tmpdir(), 'jest-global-teardown-esm');

beforeAll(() => {
  runYarnInstall(e2eDir);
});

beforeEach(() => {
  cleanup(DIR);
  cleanup(project1DIR);
  cleanup(project2DIR);
  cleanup(esmTmpDir);
});
afterAll(() => {
  cleanup(DIR);
  cleanup(project1DIR);
  cleanup(project2DIR);
  cleanup(esmTmpDir);
});

test('globalTeardown is triggered once after all test suites', () => {
  createDirectory(DIR);
  const teardownPath = path.resolve(e2eDir, 'teardown.js');
  const result = runWithJson('global-teardown', [
    `--globalTeardown=${teardownPath}`,
    '--testPathPattern=__tests__',
  ]);

  expect(result.exitCode).toBe(0);
  const files = fs.readdirSync(DIR);
  expect(files).toHaveLength(1);
  const teardown = fs.readFileSync(path.join(DIR, files[0]), 'utf8');
  expect(teardown).toBe('teardown');
});

test('jest throws an error when globalTeardown does not export a function', () => {
  const teardownPath = path.resolve(e2eDir, 'invalidTeardown.js');
  const {exitCode, stderr} = runJest(e2eDir, [
    `--globalTeardown=${teardownPath}`,
    '--testPathPattern=__tests__',
  ]);

  expect(exitCode).toBe(1);
  expect(stderr).toContain('Jest: Got error running globalTeardown');
  expect(stderr).toContain(
    `globalTeardown file must export a function at ${teardownPath}`,
  );
});

test('globalSetup function gets global config object and project config as parameters', () => {
  const teardownPath = path.resolve(e2eDir, 'teardownWithConfig.js');

  const testPathPattern = 'pass';

  const result = runJest(e2eDir, [
    `--globalTeardown=${teardownPath}`,
    `--testPathPattern=${testPathPattern}`,
    '--cache=true',
  ]);

  expect(result.stdout).toBe(`${testPathPattern}\ntrue`);
});

test('should call globalTeardown function of multiple projects', () => {
  const configPath = path.resolve(e2eDir, 'projects.jest.config.js');

  const result = runWithJson('global-teardown', [`--config=${configPath}`]);

  expect(result.exitCode).toBe(0);

  expect(fs.existsSync(DIR)).toBe(true);
  expect(fs.existsSync(project1DIR)).toBe(true);
  expect(fs.existsSync(project2DIR)).toBe(true);
});

test('should not call a globalTeardown of a project if there are no tests to run from this project', () => {
  const configPath = path.resolve(e2eDir, 'projects.jest.config.js');

  const result = runWithJson('global-teardown', [
    `--config=${configPath}`,
    '--testPathPattern=project-1',
  ]);

  expect(result.exitCode).toBe(0);

  expect(fs.existsSync(DIR)).toBe(true);
  expect(fs.existsSync(project1DIR)).toBe(true);
  expect(fs.existsSync(project2DIR)).toBe(false);
});

test('globalTeardown works with default export', () => {
  const teardownPath = path.resolve(e2eDir, 'teardownWithDefaultExport.js');

  const testPathPattern = 'pass';

  const result = runJest(e2eDir, [
    `--globalTeardown=${teardownPath}`,
    `--testPathPattern=${testPathPattern}`,
    '--cache=true',
  ]);

  expect(result.stdout).toBe(`${testPathPattern}\ntrue`);
});

test('globalTeardown throws with named export', () => {
  const teardownPath = path.resolve(
    e2eDir,
    'invalidTeardownWithNamedExport.js',
  );

  const {exitCode, stderr} = runJest(e2eDir, [
    `--globalTeardown=${teardownPath}`,
    '--testPathPattern=__tests__',
  ]);

  expect(exitCode).toBe(1);
  expect(stderr).toContain('Jest: Got error running globalTeardown');
  expect(stderr).toContain(
    `globalTeardown file must export a function at ${teardownPath}`,
  );
});

test('globalTeardown works with ESM modules', () => {
  const {exitCode} = runJest('global-teardown-esm', ['--no-cache'], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  expect(exitCode).toBe(0);
});
