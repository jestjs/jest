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

const DIR = path.resolve(tmpdir(), 'jest_environment_jsdom_test');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('check is not leaking memory', () => {
  writeFiles(DIR, {
    '__tests__/a.test.js': `test('a', () => console.log('a'));`,
    '__tests__/b.test.js': `test('b', () => console.log('b'));`,
    'package.json': JSON.stringify({jest: {testEnvironment: 'jsdom'}}),
  });

  const {stderr} = runJest(DIR, ['--detect-leaks', '--runInBand']);
  expect(stderr).toMatch(/PASS\s__tests__\/a.test.js/);
  expect(stderr).toMatch(/PASS\s__tests__\/b.test.js/);
});
