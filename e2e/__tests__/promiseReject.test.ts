/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {cleanup, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve('../promise-reject');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('', () => {
  writeFiles(DIR, {
    'package.json': '{}',
    'promiseReject.test.js': `
     test('test', () => {
       return Promise.reject(null)
     });
   `,
  });
  const {stdout, stderr, exitCode} = runJest(DIR);
  expect(stdout).toBe('');
  expect(stderr).toMatch(/(Failed|thrown): null/);
  expect(exitCode).toBe(1);
});
