/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {writeFiles} from '../Utils';
import {json as runWithJson} from '../runJest';

const DIR = path.resolve(__dirname, '../setup-files-after-env-config');

const pkgJsonOutputFilePath = path.join(
  process.cwd(),
  'e2e/setup-files-after-env-config/package.json',
);

afterAll(() => {
  fs.unlinkSync(pkgJsonOutputFilePath);
});

describe('setupFilesAfterEnv', () => {

  it('requires setup files *after* the test runners are required', () => {
    const pkgJson = {
      jest: {
        setupFilesAfterEnv: ['./setupHooksIntoRunner.js'],
      },
    };

    writeFiles(DIR, {
      'package.json': JSON.stringify(pkgJson, null, 2),
    });

    const result = runWithJson('setup-files-after-env-config', [
      'runnerPatch.test.js',
    ]);

    expect(result.json.numTotalTests).toBe(1);
    expect(result.json.numPassedTests).toBe(1);
    expect(result.json.testResults.length).toBe(1);
    expect(result.exitCode).toBe(0);
  });
});
