/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {cleanup, makeTemplate, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../to-throw-error-matching-snapshot');
const TESTS_DIR = path.resolve(DIR, '__tests__');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

test('works fine when function throws error', () => {
  const filename = 'works-fine-when-function-throws-error.test.js';
  const template =
    makeTemplate(`test('works fine when function throws error', () => {
       expect(() => { throw new Error('apple'); })
         .toThrowErrorMatchingSnapshot();
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template()});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }
});

test("throws the error if tested function didn't throw error", () => {
  const filename = 'throws-if-tested-function-did-not-throw.test.js';
  const template =
    makeTemplate(`test('throws the error if tested function did not throw error', () => {
      expect(() => {}).toThrowErrorMatchingSnapshot();
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template()});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Received function did not throw');
    expect(exitCode).toBe(1);
  }
});

test('accepts custom snapshot name', () => {
  const filename = 'accept-custom-snapshot-name.test.js';
  const template = makeTemplate(`test('accepts custom snapshot name', () => {
      expect(() => { throw new Error('apple'); })
        .toThrowErrorMatchingSnapshot('custom-name');
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template()});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }
});

test('cannot be used with .not', () => {
  const filename = 'cannot-be-used-with-not.test.js';
  const template = makeTemplate(`test('cannot be used with .not', () => {
       expect(() => { throw new Error('apple'); })
         .not
         .toThrowErrorMatchingSnapshot();
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template()});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshot matchers cannot be used with not');
    expect(exitCode).toBe(1);
  }
});

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
    expect(snapshot).toMatchSnapshot();
    expect(exitCode).toBe(0);
  }
});
