/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
import {cleanup} from '../Utils';
import runJest from '../runJest';

const DIR = `${tmpdir()}/jest-test-environment`;

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

it('triggers setup/teardown hooks', () => {
  const testDir = path.resolve(
    __dirname,
    '..',
    'test-environment-async',
    '__tests__',
  );
  const testFile = path.join(testDir, 'custom.test.js');

  const result = runJest('test-environment-async');
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain(`TestEnvironment.setup: ${testFile}`);

  const teardown = fs.readFileSync(`${DIR}/teardown`, 'utf8');
  expect(teardown).toBe('teardown');
});
