/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
  it('requires multiple setup files before each file in the suite', () => {
    const pkgJson = {
      jest: {
        setupFilesAfterEnv: ['./setup1.js', './setup2.js'],
      },
    };

    writeFiles(DIR, {
      'package.json': JSON.stringify(pkgJson, null, 2),
    });

    const result = runWithJson('setup-files-after-env-config', [
      'test1.test.js',
      'test2.test.js',
    ]);

    expect(result.json.numTotalTests).toBe(2);
    expect(result.json.numPassedTests).toBe(2);
    expect(result.json.testResults).toHaveLength(2);
    expect(result.exitCode).toBe(0);
  });

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
    expect(result.json.testResults).toHaveLength(1);
    expect(result.exitCode).toBe(0);
  });

  it('awaits async function returned from the setup file (jest-circus)', () => {
    const pkgJson = {
      jest: {
        setupFilesAfterEnv: ['./setupAsyncFunction.js'],
        testRunner: 'jest-circus',
      },
    };

    writeFiles(DIR, {
      'package.json': JSON.stringify(pkgJson, null, 2),
    });

    const result = runWithJson('setup-files-after-env-config', [
      'setupAsyncFunction.test.js',
    ]);

    expect(result.json.numTotalTests).toBe(1);
    expect(result.json.numPassedTests).toBe(1);
    expect(result.json.testResults).toHaveLength(1);
    expect(result.exitCode).toBe(0);
  });

  it('awaits async function returned from the setup file (jest-jasmine2)', () => {
    const pkgJson = {
      jest: {
        setupFilesAfterEnv: ['./setupAsyncFunction.js'],
        testRunner: 'jest-jasmine2',
      },
    };

    writeFiles(DIR, {
      'package.json': JSON.stringify(pkgJson, null, 2),
    });

    const result = runWithJson('setup-files-after-env-config', [
      'setupAsyncFunction.test.js',
    ]);

    expect(result.json.numTotalTests).toBe(1);
    expect(result.json.numPassedTests).toBe(1);
    expect(result.json.testResults).toHaveLength(1);
    expect(result.exitCode).toBe(0);
  });
});
