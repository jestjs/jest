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

const DIR = path.join(tmpdir(), 'jest-global-teardown-per-worker');
const project1DIR = path.join(
  tmpdir(),
  'jest-global-teardown-per-worker-project-1',
);
const project2DIR = path.join(
  tmpdir(),
  'jest-global-teardown-per-worker-project-2',
);
const e2eDir = path.resolve(__dirname, '../global-teardown-per-worker');
const esmTmpDir = path.join(tmpdir(), 'jest-global-teardown-per-worker-esm');

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

test('globalTeardownPerWorker is triggered once after all test suites per worker', () => {
  createDirectory(DIR);
  const teardownPath = path.resolve(e2eDir, 'teardown.js');
  const result = runWithJson('global-teardown-per-worker', [
    '--maxWorkers=2',
    '--workerIdleMemoryLimit=100MB',
    `--globalTeardownPerWorker=${teardownPath}`,
    '--testPathPatterns=__tests__',
  ]);

  expect(result.exitCode).toBe(0);
  const files = fs.readdirSync(DIR);
  expect(files).toHaveLength(2);
  const content = files.map(file => {
    const data = fs.readFileSync(path.join(DIR, file), 'utf8');
    return data.split('\n');
  });
  for (const [firstLine] of content) {
    expect(firstLine).toBe('teardown-per-worker');
  }
  const secondLines = content.map(([, secondLine]) => secondLine);
  secondLines.sort();
  expect(secondLines).toEqual(['1', '2']);
});

test('globalTeardownPerWorker with worker threads', () => {
  createDirectory(DIR);
  const teardownPath = path.resolve(e2eDir, 'teardown.js');
  const result = runWithJson('global-teardown-per-worker', [
    '--maxWorkers=2',
    '--workerIdleMemoryLimit=100MB',
    `--globalTeardownPerWorker=${teardownPath}`,
    '--testPathPatterns=__tests__',
    '--workerThreads',
  ]);

  expect(result.exitCode).toBe(0);
  const files = fs.readdirSync(DIR);
  expect(files).toHaveLength(2);
  const content = files.map(file => {
    const data = fs.readFileSync(path.join(DIR, file), 'utf8');
    return data.split('\n');
  });
  for (const [firstLine] of content) {
    expect(firstLine).toBe('teardown-per-worker');
  }
  const secondLines = content.map(([, secondLine]) => secondLine);
  secondLines.sort();
  expect(secondLines).toEqual(['1', '2']);
});

test('jest throws an error when globalTeardownPerWorker does not export a function', () => {
  const teardownPath = path.resolve(e2eDir, 'invalidTeardown.js');
  const {exitCode, stderr} = runJest(e2eDir, [
    '--maxWorkers=2',
    '--workerIdleMemoryLimit=100MB',
    `--globalTeardownPerWorker=${teardownPath}`,
    '--testPathPatterns=__tests__',
  ]);

  expect(exitCode).toBe(1);
  expect(stderr).toContain('Jest: Got error running globalTeardownPerWorker');
  expect(stderr).toContain(
    `globalTeardownPerWorker file must export a function at ${teardownPath}`,
  );
});

test('globalTeardownPerWorker function gets global config object and project config as parameters', () => {
  const teardownPath = path.resolve(e2eDir, 'teardownWithConfig.js');

  const result = runJest(e2eDir, [
    '--maxWorkers=2',
    '--workerIdleMemoryLimit=100MB',
    `--globalTeardownPerWorker=${teardownPath}`,
    '--testPathPatterns=pass',
    '--cache=true',
  ]);

  const expected = ["[ 'pass' ]", 'true', "[ 'pass' ]", 'true'].join('\n');
  expect(result.stdout).toBe(expected);
});

test('should call globalTeardownPerWorker function of multiple projects', () => {
  const configPath = path.resolve(e2eDir, 'projects.jest.config.js');

  const result = runWithJson('global-teardown-per-worker', [
    '--maxWorkers=2',
    '--workerIdleMemoryLimit=100MB',
    `--config=${configPath}`,
  ]);

  expect(result.exitCode).toBe(0);

  expect(fs.existsSync(DIR)).toBe(true);
  expect(fs.existsSync(project1DIR)).toBe(true);
  expect(fs.existsSync(project2DIR)).toBe(true);
});

test('should not call a globalTeardownPerWorker of a project if there are no tests to run from this project', () => {
  const configPath = path.resolve(e2eDir, 'projects.jest.config.js');

  const result = runWithJson('global-teardown-per-worker', [
    '--maxWorkers=2',
    '--workerIdleMemoryLimit=100MB',
    `--config=${configPath}`,
    '--testPathPatterns=teardown1',
  ]);

  expect(result.exitCode).toBe(0);

  expect(fs.existsSync(DIR)).toBe(true);
  expect(fs.existsSync(project1DIR)).toBe(true);
  expect(fs.existsSync(project2DIR)).toBe(false);
});

test('globalTeardownPerWorker works with default export', () => {
  const teardownPath = path.resolve(e2eDir, 'teardownWithDefaultExport.js');

  const result = runJest(e2eDir, [
    '--maxWorkers=2',
    '--workerIdleMemoryLimit=100MB',
    `--globalTeardownPerWorker=${teardownPath}`,
    '--testPathPatterns=pass',
    '--cache=true',
  ]);

  const expected = ["[ 'pass' ]", 'true', "[ 'pass' ]", 'true'].join('\n');
  expect(result.stdout).toBe(expected);
});

test('globalTeardownPerWorker throws with named export', () => {
  const teardownPath = path.resolve(
    e2eDir,
    'invalidTeardownWithNamedExport.js',
  );

  const {exitCode, stderr} = runJest(e2eDir, [
    '--maxWorkers=2',
    '--workerIdleMemoryLimit=100MB',
    `--globalTeardownPerWorker=${teardownPath}`,
    '--testPathPatterns=__tests__',
  ]);

  expect(exitCode).toBe(1);
  expect(stderr).toContain('Jest: Got error running globalTeardownPerWorker');
  expect(stderr).toContain(
    `globalTeardownPerWorker file must export a function at ${teardownPath}`,
  );
});

test('globalTeardownPerWorker works with ESM modules', () => {
  const {exitCode} = runJest(
    'global-teardown-per-worker-esm',
    ['--maxWorkers=2', '--workerIdleMemoryLimit=100MB', '--no-cache'],
    {
      nodeOptions: '--experimental-vm-modules --no-warnings',
    },
  );

  expect(exitCode).toBe(0);
});
