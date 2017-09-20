/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

const path = require('path');
const {makeTemplate, writeFiles, cleanup} = require('../utils');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../toThrowErrorMatchingSnapshot');
const TESTS_DIR = path.resolve(DIR, '__tests__');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

test('works fine when function throws error', () => {
  const filename = 'works-fine-when-function-throws-error.test.js';
  const template = makeTemplate(`test('works fine when function throws error', () => {
       expect(() => { throw new Error('apple'); })
         .toThrowErrorMatchingSnapshot();
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template()});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written in 1 test suite.');
    expect(status).toBe(0);
  }
});

test(`throws the error if tested function didn't throw error`, () => {
  const filename = 'throws-if-tested-function-did-not-throw.test.js';
  const template = makeTemplate(`test('throws the error if tested function did not throw error', () => {
      expect(() => {}).toThrowErrorMatchingSnapshot();
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template()});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch(`Expected the function to throw an error.`);
    expect(status).toBe(1);
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
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written in 1 test suite.');
    expect(status).toBe(0);
  }
});

test('cannot be used with .not', () => {
  const filename = 'cannot-be-used-with-not.test.js';
  const template = makeTemplate(`test('cannot be used with .not', () => {
       expect('').not.toThrowErrorMatchingSnapshot();
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template()});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch(
      'Jest: `.not` cannot be used with `.toThrowErrorMatchingSnapshot()`.',
    );
    expect(status).toBe(1);
  }
});
