/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import {resolve} from 'path';
import {cleanup, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = resolve(tmpdir(), 'worker-idle-restart-at-end');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('does not force exit a worker restarted for its idle memory at the end', () => {
  writeFiles(DIR, {
    '__tests__/test1.test.js': "test('1', () => {});",
    '__tests__/test2.test.js': "test('2', () => {});",
    '__tests__/test3.test.js': "test('3', () => {});",
    'package.json': JSON.stringify({
      jest: {
        maxWorkers: 2,
        testEnvironment: 'node',
        // Every worker is over this after a test file, so each one restarts
        // after its last file, as the run ends.
        workerIdleMemoryLimit: '1MB',
      },
    }),
    // Workers take longer to start than the pool waits for them to exit,
    // like workers on a loaded CI machine.
    'slowWorkerStart.js': `
      if (process.env.JEST_WORKER_ID) {
        const end = Date.now() + 1000;
        while (Date.now() < end) {}
      }
    `,
  });

  const {exitCode, stderr} = runJest(DIR, [], {
    nodeOptions: `--require ${resolve(DIR, 'slowWorkerStart.js')}`,
  });

  expect(exitCode).toBe(0);
  expect(stderr).not.toContain('A worker process has failed to exit');
});
