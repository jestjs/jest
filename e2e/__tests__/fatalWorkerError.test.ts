/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import os from 'os';
import {cleanup, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(os.tmpdir(), 'fatal-worker-error');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

const NUMBER_OF_TESTS_TO_FORCE_USING_WORKERS = 25;

test('fails a test that terminates the worker with a fatal error', () => {
  const testFiles = {
    '__tests__/fatalWorkerError.test.js': `
      test('fatal worker error', () => {
        process.exit(134);
      });
    `,
  };

  for (let i = 0; i <= NUMBER_OF_TESTS_TO_FORCE_USING_WORKERS; i++) {
    testFiles[`__tests__/test${i}.test.js`] = `
      test('test ${i}', () => {});
    `;
  }

  writeFiles(DIR, {
    ...testFiles,
    'package.json': '{}',
  });

  const {status, stderr} = runJest(DIR, ['--maxWorkers=2']);

  const numberOfTestsPassed = (stderr.match(/\bPASS\b/g) || []).length;

  expect(status).not.toBe(0);
  expect(numberOfTestsPassed).toBe(Object.keys(testFiles).length - 1);
  expect(stderr).toContain('FAIL __tests__/fatalWorkerError.test.js');
  expect(stderr).toContain('Call retries were exceeded');
});
