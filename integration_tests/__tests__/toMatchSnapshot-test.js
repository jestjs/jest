/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const rimraf = require('rimraf');
const runJest = require('../runJest');
const skipOnWindows = require('skipOnWindows');

const DIR = path.resolve(__dirname, '../toMatchSnapshot');
const TESTS_DIR = path.resolve(DIR, '__tests__');

skipOnWindows.suite();

const makeTemplate = string => {
  return values => {
    return string.replace(/\$(\d+)/g, (match, number) => {
      return values[number - 1];
    });
  };
};

const cleanup = () => rimraf.sync(TESTS_DIR);

const makeTests = (tests: {[filename: string]: string}) => {
  mkdirp.sync(TESTS_DIR);
  Object.keys(tests).forEach(filename => {
    fs.writeFileSync(path.resolve(TESTS_DIR, filename), tests[filename]);
  });
};

beforeEach(cleanup);
afterAll(cleanup);

test('basic support', () => {
  const filename = 'basic-support-test.js';
  const template = makeTemplate(
    `test('snapshots', () => expect($1).toMatchSnapshot());`,
  );

  makeTests({[filename]: template(['{apple: "original value"}'])});

  {
    const {stderr, status} = runJest(DIR, [filename]);
    expect(stderr).toMatch('1 snapshot written in 1 test file.');
    expect(status).toBe(0);
  }
  {
    const {stderr, status} = runJest(DIR, [filename]);
    expect(stderr).toMatch('1 snapshot,');
    expect(stderr).not.toMatch('1 snapshot written in 1 test file.');
    expect(status).toBe(0);
  }

  makeTests({[filename]: template(['{apple: "updated value"}'])});

  {
    const {stderr, status} = runJest(DIR, [filename]);
    expect(stderr).toMatch('Received value does not match the stored snapshot');
    expect(status).toBe(1);
  }

  {
    const {stderr, status} = runJest(DIR, [filename, '-u']);
    expect(stderr).toMatch('1 snapshot updated in 1 test file.');
    expect(status).toBe(0);
  }
});

test.skip('error thrown before snapshot', () => {
  const filename = 'error-thrown-before-snapshot-test.js';
  const template = makeTemplate(
    `test('snapshots', () => {
      expect($1).toBeTruthy();
      expect($2).toMatchSnapshot();
    });`,
  );

  makeTests({[filename]: template(['true', '{apple: "original value"}'])});

  {
    const {stderr, status} = runJest(DIR, [filename]);
    expect(stderr).toMatch('1 snapshot written in 1 test file.');
    expect(status).toBe(0);
  }
  {
    const {stderr, status} = runJest(DIR, [filename]);
    expect(stderr).toMatch('1 snapshot,');
    expect(status).toBe(0);
  }

  makeTests({[filename]: template(['false', '{apple: "original value"}'])});

  {
    const {stderr, status} = runJest(DIR, [filename]);
    expect(stderr).not.toMatch('1 obsolete snapshot found');
    expect(status).toBe(0);
  }
});

test('first snapshot fails, second passes', () => {
  const filename = 'first-snapshot-fails-second-passes-test.js';
  const template = makeTemplate(
    `test('snapshots', () => {
      expect($1).toMatchSnapshot();
      expect($2).toMatchSnapshot();
    });`,
  );

  makeTests({[filename]: template([`'apple'`, `'banana'`])});

  {
    const {stderr, status} = runJest(DIR, [filename]);
    expect(stderr).toMatch('2 snapshots written in 1 test file.');
    expect(status).toBe(0);
  }

  makeTests({[filename]: template([`'kiwi'`, `'banana'`])});

  {
    const {stderr, status} = runJest(DIR, [filename]);
    expect(stderr).toMatch('Received value does not match the stored snapshot');
    expect(stderr).not.toMatch('1 obsolete snapshot found');
    expect(status).toBe(1);
  }
});
