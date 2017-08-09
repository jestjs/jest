/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const path = require('path');
const os = require('os');
const skipOnWindows = require('../../scripts/skip_on_windows');
const {cleanup, writeFiles} = require('../utils');
const runJest = require('../runJest');

const DIR = path.resolve(os.tmpdir(), 'json_stdout_test');

skipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

const reporterCode = `
'use strict';

console.log('at require time');
console.log(console.log.toString());
module.exports = class Reporter {
  onRunStart() {
    console.log('at runtime');
  }
};
`;

test('does not pollute stdout from third party code (or any code)', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/hey.test.js': `test('test', () => {})`,
    'custom_reporter.js': reporterCode,
    'package.json': JSON.stringify({
      jest: {
        // Reporter will be required as a regular module in the master process
        // before any of the test run, which makes it a perfect place to try
        // to break the stdout by console.logging some text.
        reporters: ['<rootDir>/custom_reporter.js', 'default'],
      },
    }),
  });

  let stdout;
  let stderr;
  ({stdout, stderr} = runJest(DIR, ['--json']));
  expect(stdout).not.toMatch('at require time');
  expect(stdout).not.toMatch('at runtime');
  expect(stderr).toMatch('at require time');
  expect(stderr).toMatch('at runtime');
  expect(() => JSON.parse(stdout)).not.toThrow();

  ({stdout, stderr} = runJest(DIR, ['--listTests', '__tests__/hey.test.js']));

  expect(stdout).not.toMatch('at require time');
  expect(stdout).not.toMatch('at runtime');
  expect(stderr).not.toMatch('at require time');
  expect(stderr).not.toMatch('at runtime');
  expect(() => JSON.parse(stdout)).not.toThrow();
  expect(stdout).toMatch('hey.test.js');
});

test('prints to stdout if not in json mode', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/hey.test.js': `test('test', () => {})`,
    'custom_reporter.js': reporterCode,
    'package.json': JSON.stringify({
      jest: {
        // Reporter will be required as a regular module in the master process
        // before any of the test run, which makes it a perfect place to try
        // to break the stdout by console.logging some text.
        reporters: ['<rootDir>/custom_reporter.js', 'default'],
      },
    }),
  });

  const {status, stdout, stderr} = runJest(DIR);
  expect(stderr).not.toMatch('at runtime');
  expect(stderr).not.toMatch('at require time');
  expect(stdout).toMatch('at require time');
  expect(stdout).toMatch('at runtime');
  expect(status).toBe(0);
});
