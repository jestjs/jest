/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {wrap} from 'jest-snapshot-serializer-raw';
import {cleanup, makeTemplate, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../to-throw-error-matching-snapshot');
const TESTS_DIR = path.resolve(DIR, '__tests__');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

test('should support rejecting promises', () => {
  const filename = 'should-support-rejecting-promises.test.js';
  const template =
    makeTemplate(`test('should support rejecting promises', () => {
      return expect(Promise.reject(new Error('octopus'))).rejects.toThrowErrorMatchingSnapshot();
    });
  `);

  {
    writeFiles(TESTS_DIR, {[filename]: template()});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);

    const snapshot = fs.readFileSync(
      `${TESTS_DIR}/__snapshots__/${filename}.snap`,
      'utf8',
    );

    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(wrap(snapshot)).toMatchSnapshot();
    expect(exitCode).toBe(0);
  }
});
