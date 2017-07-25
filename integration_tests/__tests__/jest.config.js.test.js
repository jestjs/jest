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
const skipOnWindows = require('../../scripts/skip_on_windows');
const {extractSummary, cleanup, writeFiles} = require('../utils');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../jest.config.js');

skipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('works with jest.conf.js', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `test('banana', () => expect(1).toBe(1));`,
    'jest.config.js': `module.exports = {testRegex: '.*-banana.js'};`,
    'package.json': '{}',
  });

  const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  expect(status).toBe(0);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('traverses directory tree up until it finds jest.config', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
    test('banana', () => expect(1).toBe(1));
    test('abc', () => console.log(process.cwd()));
    `,
    'jest.config.js': `module.exports = {testRegex: '.*-banana.js'};`,
    'package.json': '{}',
    'some/nested/directory/file.js': '// nothing special',
  });

  const {stderr, status, stdout} = runJest(
    path.join(DIR, 'some', 'nested', 'directory'),
    ['-w=1', '--ci=false'],
    {skipPkgJsonCheck: true},
  );

  // Snapshot the console.loged `process.cwd()` and make sure it stays the same
  expect(
    stdout.replace(/^\W+(.*)integration_tests/gm, '<<REPLACED>>'),
  ).toMatchSnapshot();

  const {rest, summary} = extractSummary(stderr);
  expect(status).toBe(0);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('invalid JS in jest.config.js', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `test('banana', () => expect(1).toBe(1));`,
    'jest.config.js': `module.exports = i'll break this file yo`,
    'package.json': '{}',
  });

  const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false']);
  expect(stderr).toMatch('SyntaxError: ');
  expect(status).toBe(1);
});
