/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const {makeTemplate, makeTests, cleanup} = require('../utils');
const path = require('path');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../toMatchSnapshot');
const TESTS_DIR = path.resolve(DIR, '__tests__');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

test('basic support', () => {
  const filename = 'basic-support-test.js';
  const template = makeTemplate(
    `test('snapshots', () => expect($1).toMatchSnapshot());`,
  );

  {
    makeTests(TESTS_DIR, {[filename]: template(['{apple: "original value"}'])});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written in 1 test suite.');
    expect(status).toBe(0);
  }

  {
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(stderr).not.toMatch('1 snapshot written in 1 test suite.');
    expect(status).toBe(0);
  }

  {
    makeTests(TESTS_DIR, {[filename]: template(['{apple: "updated value"}'])});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Received value does not match stored snapshot');
    expect(status).toBe(1);
  }

  {
    const {stderr, status} = runJest(DIR, [
      '-w=1',
      '--ci=false',
      filename,
      '-u',
    ]);
    expect(stderr).toMatch('1 snapshot updated in 1 test suite.');
    expect(status).toBe(0);
  }
});

test('error thrown before snapshot', () => {
  const filename = 'error-thrown-before-snapshot-test.js';
  const template = makeTemplate(`test('snapshots', () => {
      expect($1).toBeTruthy();
      expect($2).toMatchSnapshot();
    });`);

  {
    makeTests(TESTS_DIR, {[filename]: template(['true', '{a: "original"}'])});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written in 1 test suite.');
    expect(status).toBe(0);
  }

  {
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(status).toBe(0);
  }

  {
    makeTests(TESTS_DIR, {[filename]: template(['false', '{a: "original"}'])});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).not.toMatch('1 obsolete snapshot found');
    expect(status).toBe(1);
  }
});

test('first snapshot fails, second passes', () => {
  const filename = 'first-snapshot-fails-second-passes-test.js';
  const template = makeTemplate(`test('snapshots', () => {
      expect($1).toMatchSnapshot();
      expect($2).toMatchSnapshot();
    });`);

  {
    makeTests(TESTS_DIR, {[filename]: template([`'apple'`, `'banana'`])});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('2 snapshots written in 1 test suite.');
    expect(status).toBe(0);
  }

  {
    makeTests(TESTS_DIR, {[filename]: template([`'kiwi'`, `'banana'`])});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Received value does not match stored snapshot');
    expect(stderr).toMatch('- "apple"\n    + "kiwi"');
    expect(stderr).not.toMatch('1 obsolete snapshot found');
    expect(status).toBe(1);
  }
});

test('does not mark snapshots as obsolete in skipped tests', () => {
  const filename = 'no-obsolete-if-skipped-test.js';
  const template = makeTemplate(`test('snapshots', () => {
      expect(true).toBe(true);
    });

    $1('will be skipped', () => {
      expect({a: 6}).toMatchSnapshot();
    });
    `);

  {
    makeTests(TESTS_DIR, {[filename]: template(['test'])});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written in 1 test suite.');
    expect(status).toBe(0);
  }

  {
    makeTests(TESTS_DIR, {[filename]: template(['test.skip'])});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).not.toMatch('1 obsolete snapshot found');
    expect(status).toBe(0);
  }
});

test('accepts custom snapshot name', () => {
  const filename = 'accept-custom-snapshot-name-test.js';
  const template = makeTemplate(`test('accepts custom snapshot name', () => {
      expect(true).toMatchSnapshot('custom-name');
    });
    `);

  {
    makeTests(TESTS_DIR, {[filename]: template()});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written in 1 test suite.');
    expect(status).toBe(0);
  }
});
