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
  mkdirp(TESTS_DIR);
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
    expect(status).toBe(0);
    expect(stderr).toMatch('1 snapshot written in 1 test file.');
  }
  {
    const {stderr, status} = runJest(DIR, [filename]);
    expect(status).toBe(0);
    expect(stderr).toMatch('1 snapshot,');
  }

  makeTests({[filename]: template(['{apple: "updated value"}'])});

  {
    const {stderr, status} = runJest(DIR, [filename]);
    expect(status).toBe(1);
    expect(stderr).toMatch('Received value does not match the stored snapshot');
  }

  {
    const {stderr, status} = runJest(DIR, [filename, '-u']);
    expect(status).toBe(0);
    expect(stderr).toMatch('1 snapshot updated in 1 test file.');
  }
});
