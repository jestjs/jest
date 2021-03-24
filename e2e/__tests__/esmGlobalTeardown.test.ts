/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
import {onNodeVersions} from '@jest/test-utils';
import {createDirectory} from 'jest-util';
import {cleanup} from '../Utils';
import {json as runWithJson} from '../runJest';

const DIR = path.join(tmpdir(), 'jest-esm-global-teardown');
const e2eDir = path.resolve(__dirname, '../esm-global-teardown');

beforeEach(() => {
  cleanup(DIR);
});
afterAll(() => {
  cleanup(DIR);
});

onNodeVersions('^12.16.0 || >=13.7.0', () => {
  test('globalTeardown is triggered once after all test suites', () => {
    createDirectory(DIR);
    const result = runWithJson(e2eDir, [], {
      nodeOptions: '--experimental-vm-modules',
    });

    expect(result.exitCode).toBe(0);
    const files = fs.readdirSync(DIR);
    expect(files).toHaveLength(1);
    const teardown = fs.readFileSync(path.join(DIR, files[0]), 'utf8');
    expect(teardown).toBe('teardown');
  });
});
