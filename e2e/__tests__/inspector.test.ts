/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {tmpdir} from 'os';
import * as path from 'path';
import {
  cleanup,
  generateTestFilesToForceUsingWorkers,
  writeFiles,
} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'inspector');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('fails a test which causes an infinite loop', () => {
  const testFiles = {
    ...generateTestFilesToForceUsingWorkers(),
    'package.json': `{
        "testEnvironment": "node"
    }`,
  };

  writeFiles(DIR, {
    ...testFiles,
    '__tests__/inspector.test.js': `
    test('infinite loop error', () => {
      while(true) {}
    });
  `,
  });

  const {exitCode, stdout, stderr} = runJest(DIR, ['--maxWorkers=2']);

  console.log({exitCode, stdout, stderr});

  const numberOfTestsPassed = (stderr.match(/\bPASS\b/g) || []).length;

  expect(numberOfTestsPassed).toBe(Object.keys(testFiles).length - 1);
  expect(stderr).toContain('FAIL __tests__/inspector.test.js');
});
