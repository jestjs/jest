/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const path = require('path');
const os = require('os');
const skipOnWindows = require('skipOnWindows');
const runJest = require('../runJest');
const {extractSummary} = require('../utils');
const {createEmptyPackage, writeFiles, cleanup} = require('../utils');

const DIR = path.resolve(os.tmpdir(), 'global-variables.test');
const TEST_DIR = path.resolve(DIR, '__tests__');

skipOnWindows.suite();

beforeEach(() => {
  cleanup(DIR);
  createEmptyPackage(DIR);
});

afterAll(() => cleanup(DIR));

test('basic test constructs', () => {
  const filename = 'basic.test-constructs.test.js';
  const content = `
    it('it', () => {});
    test('test', () => {});

    describe('describe', () => {
      it('it', () => {});
      test('test', () => {});
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, status} = runJest(DIR);
  expect(status).toBe(0);

  const {summary, rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('skips', () => {
  const filename = 'skips-constructs.test.js';
  const content = `
    it('it', () => {});
    xtest('xtest', () => {});
    xit('xit', () => {});
    it.skip('it.skip', () => {});
    test.skip('test.skip', () => {});

    xdescribe('xdescribe', () => {
      it('it', () => {});
      test('test', () => {});
    });

    describe.skip('describe.skip', () => {
      test('test', () => {});
      describe('describe', () => {
        test('test', () => {});
      });
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, status} = runJest(DIR);

  const {summary, rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(status).toBe(0);
});

test('only', () => {
  const filename = 'only-constructs.test.js';
  const content = `
    it('it', () => {});
    test.only('test.only', () => {});
    it.only('it.only', () => {});
    fit('fit', () => {});

    fdescribe('fdescribe', () => {
      it('it', () => {});
      test('test', () => {});
    });

    describe.only('describe.only', () => {
      test('test', () => {});
      describe('describe', () => {
        test('test', () => {});
      });
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, status} = runJest(DIR);
  expect(status).toBe(0);

  const {summary, rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('tests with no implementation', () => {
  const filename = 'only-constructs.test.js';
  const content = `
    it('it', () => {});
    it('it, no implementation');
    test('test, no implementation');
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, status} = runJest(DIR);
  expect(status).toBe(0);

  const {summary, rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('skips with expand arg', () => {
  const filename = 'skips-constructs.test.js';
  const content = `
    it('it', () => {});
    xtest('xtest', () => {});
    xit('xit', () => {});
    it.skip('it.skip', () => {});
    test.skip('test.skip', () => {});

    xdescribe('xdescribe', () => {
      it('it', () => {});
      test('test', () => {});
    });

    describe.skip('describe.skip', () => {
      test('test', () => {});
      describe('describe', () => {
        test('test', () => {});
      });
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, status} = runJest(DIR, ['--expand']);
  expect(status).toBe(0);

  const {summary, rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('only with expand arg', () => {
  const filename = 'only-constructs.test.js';
  const content = `
    it('it', () => {});
    test.only('test.only', () => {});
    it.only('it.only', () => {});
    fit('fit', () => {});

    fdescribe('fdescribe', () => {
      it('it', () => {});
      test('test', () => {});
    });

    describe.only('describe.only', () => {
      test('test', () => {});
      describe('describe', () => {
        test('test', () => {});
      });
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, status} = runJest(DIR, ['--expand']);
  expect(status).toBe(0);

  const {summary, rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('tests with no implementation with expand arg', () => {
  const filename = 'only-constructs.test.js';
  const content = `
    it('it', () => {});
    it('it, no implementation');
    test('test, no implementation');
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, status} = runJest(DIR, ['--expand']);
  expect(status).toBe(0);

  const {summary, rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});
