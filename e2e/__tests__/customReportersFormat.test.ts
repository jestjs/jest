/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { wrap } from 'jest-snapshot-serializer-raw';
import { tmpdir } from 'os';
import * as path from 'path';
import runJest from '../runJest';
import { cleanup } from '../Utils';

const DIR = path.resolve(tmpdir(), 'custom-reporters-test-dir');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

describe('Custom Reporters Integration', () => {
  test('valid string format for adding reporters', () => {
    const reporterConfig = {
      reporters: ['<rootDir>/reporters/TestReporter.js'],
    };

    const {exitCode} = runJest('custom-reporters', [
      '--config',
      JSON.stringify(reporterConfig),
      'add.test.js',
    ]);

    expect(exitCode).toBe(0);
  });

  test('valid array format for adding reporters', () => {
    const reporterConfig = {
      reporters: [
        ['<rootDir>/reporters/TestReporter.js', {'Aaron Abramov': 'Awesome'}],
      ],
    };

    const {exitCode, stdout} = runJest('custom-reporters', [
      '--config',
      JSON.stringify(reporterConfig),
      'add.test.js',
    ]);

    expect(wrap(stdout)).toMatchSnapshot();
    expect(exitCode).toBe(0);
  });

  test('invalid format for adding reporters', () => {
    const reporterConfig = {
      reporters: [[3243242]],
    };

    const {exitCode, stderr} = runJest('custom-reporters', [
      '--config',
      JSON.stringify(reporterConfig),
      'add.test.js',
    ]);

    expect(exitCode).toBe(1);
    expect(wrap(stderr)).toMatchSnapshot();
  });

  
});
