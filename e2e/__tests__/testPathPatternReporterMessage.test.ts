/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import runJest from '../runJest';
import {cleanup, writeFiles} from '../Utils';

const DIR = path.resolve(tmpdir(), 'jest-path-pattern-reporter-message');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('prints a message with path pattern at the end', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/a.test.js': `test('a', () => {});`,
    '__tests__/b.test.js': `test('b', () => {});`,
    'package.json': '{}',
  });
  let stdout;

  ({stdout} = runJest(DIR, ['a']));
  expect(stdout).toMatch('Ran all test suites matching /a/i');

  ({stdout} = runJest(DIR, ['a', 'b']));
  expect(stdout).toMatch('Ran all test suites matching /a|b/i');

  ({stdout} = runJest(DIR, ['--testPathPattern', 'a']));
  expect(stdout).toMatch('Ran all test suites matching /a/i');

  ({stdout} = runJest(DIR, ['--testPathPattern', 'a|b']));
  expect(stdout).toMatch('Ran all test suites matching /a|b/i');
});
