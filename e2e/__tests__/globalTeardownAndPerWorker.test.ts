/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
import {cleanup, runYarnInstall} from '../Utils';
import {json as runWithJson} from '../runJest';
import {createDirectory} from 'jest-util';

const DIR = path.join(tmpdir(), 'jest-global-teardown-and-per-worker');
const project1DIR = path.join(
  tmpdir(),
  'jest-global-teardown-and-per-worker-project-1',
);
const project2DIR = path.join(
  tmpdir(),
  'jest-global-teardown-and-per-worker-project-2',
);
const e2eDir = path.resolve(__dirname, '../global-teardown-and-per-worker');

beforeAll(() => {
  runYarnInstall(e2eDir);
});

beforeEach(() => {
  cleanup(DIR);
  cleanup(project1DIR);
  cleanup(project2DIR);
});

afterAll(() => {
  cleanup(DIR);
  cleanup(project1DIR);
  cleanup(project2DIR);
});

test('globalTeardown triggered once + globalTeardownPerWorker triggered once per worker', () => {
  createDirectory(DIR);
  const teardownPath = path.join(e2eDir, 'teardown.js');
  const teardownPerWorkerPath = path.join(e2eDir, 'teardown-per-worker.js');
  const result = runWithJson(e2eDir, [
    '--maxWorkers=2',
    '--workerIdleMemoryLimit=100MB',
    `--globalTeardown=${teardownPath}`,
    `--globalTeardownPerWorker=${teardownPerWorkerPath}`,
    '--testPathPatterns=__tests__',
  ]);

  expect(result.exitCode).toBe(0);
  const files = fs.readdirSync(DIR);
  expect(files).toHaveLength(3);
  const content = files.map(file => {
    const data = fs.readFileSync(path.join(DIR, file), 'utf8');
    return data.split('\n');
  });
  for (const [firstLine, secondLine] of content) {
    if (secondLine) {
      expect(firstLine).toBe('teardown-per-worker');
    } else {
      expect(firstLine).toBe('teardown');
    }
  }
  const secondLines = content.map(([, secondLine]) => secondLine);
  secondLines.sort();
  expect(secondLines).toEqual(['1', '2', undefined]);
});
test('globalTeardown + globalTeardownPerWorker with worker threads', () => {
  createDirectory(DIR);
  const teardownPath = path.join(e2eDir, 'teardown.js');
  const teardownPerWorkerPath = path.join(e2eDir, 'teardown-per-worker.js');
  const result = runWithJson(e2eDir, [
    '--maxWorkers=2',
    '--workerIdleMemoryLimit=100MB',
    `--globalTeardown=${teardownPath}`,
    `--globalTeardownPerWorker=${teardownPerWorkerPath}`,
    '--testPathPatterns=__tests__',
    '--workerThreads',
  ]);

  expect(result.exitCode).toBe(0);
  const files = fs.readdirSync(DIR);
  expect(files).toHaveLength(3);
  const content = files.map(file => {
    const data = fs.readFileSync(path.join(DIR, file), 'utf8');
    return data.split('\n');
  });
  for (const [firstLine, secondLine] of content) {
    if (secondLine) {
      expect(firstLine).toBe('teardown-per-worker');
    } else {
      expect(firstLine).toBe('teardown');
    }
  }
  const secondLines = content.map(([, secondLine]) => secondLine);
  secondLines.sort();
  expect(secondLines).toEqual(['1', '2', undefined]);
});

test('multiple projects', () => {
  const configPath = path.resolve(e2eDir, 'projects.jest.config.js');

  const result = runWithJson(e2eDir, [
    '--maxWorkers=2',
    '--workerIdleMemoryLimit=100MB',
    `--config=${configPath}`,
  ]);

  expect(result.exitCode).toBe(0);

  expect(fs.existsSync(DIR)).toBe(true);
  expect(fs.existsSync(project1DIR)).toBe(true);
  expect(fs.existsSync(project2DIR)).toBe(true);
});
