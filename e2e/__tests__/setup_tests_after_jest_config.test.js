/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

import path from 'path';
import {json as runWithJson} from '../runJest';
import {writeFiles} from '../Utils';

const DIR = path.resolve(__dirname, '../setup-tests-after-jest-config');

describe('setupTestsAfterJest', () => {
  it('requires multiple setup files before each file in the suite', () => {
    const pkgJson = {
      jest: {
        setupTestsAfterJest: ['./setup1.js', './setup2.js'],
      },
    };

    writeFiles(DIR, {
      'package.json': JSON.stringify(pkgJson, null, 2),
    });

    const result = runWithJson('setup-tests-after-jest-config', [
      'test1.test.js',
      'test2.test.js',
    ]);

    expect(result.json.numTotalTests).toBe(2);
    expect(result.json.numPassedTests).toBe(2);
    expect(result.json.testResults.length).toBe(2);
    expect(result.status).toBe(0);
  });

  it('requires setup files *after* the test runners are required', () => {
    const pkgJson = {
      jest: {
        setupTestsAfterJest: ['./setup_hooks_into_runner.js'],
      },
    };

    writeFiles(DIR, {
      'package.json': JSON.stringify(pkgJson, null, 2),
    });

    const result = runWithJson('setup-tests-after-jest-config', [
      'runner_patch.test.js',
    ]);

    expect(result.json.numTotalTests).toBe(1);
    expect(result.json.numPassedTests).toBe(1);
    expect(result.json.testResults.length).toBe(1);
    expect(result.status).toBe(0);
  });
});
