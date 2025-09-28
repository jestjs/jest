/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'node:path';
import {onNodeVersions} from '@jest/test-utils';
import runJest, {type RunJestResult} from '../runJest';
import {runYarnInstall} from '../Utils';

const getLog = (result: RunJestResult) => result.stdout.split('\n')[1].trim();

const dir = path.resolve(__dirname, '../custom-jsdom-version/v27');

beforeEach(() => {
  runYarnInstall(dir);
});

onNodeVersions('>=20.4.0', () => {
  it('should work with custom jsdom version', () => {
    const result = runJest(dir, ['env.test.js']);
    expect(result.exitCode).toBe(0);
    expect(getLog(result)).toBe('WINDOW');
  });
});
