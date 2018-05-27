/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const path = require('path');
const ConditionalTest = require('../../scripts/ConditionalTest');
const {extractSummary, cleanup, writeFiles} = require('../Utils');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../cli_accepts_exact_filenames');

ConditionalTest.skipSuiteOnWindows();

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('CLI accepts exact file names if matchers matched', () => {
  writeFiles(DIR, {
    'foo/bar.spec.js': `
      test('foo', () => {});
    `,
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  const result = runJest(DIR, ['-i', '--forceExit', './foo/bar.spec.js']);

  expect(result.status).toBe(0);

  const {rest, summary} = extractSummary(result.stderr);

  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(result.stdout).toMatchSnapshot();
});

test('CLI skips exact file names if no matchers matched', () => {
  writeFiles(DIR, {
    'foo/bar.js': `
      test('foo', () => {);
    `,
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  const result = runJest(DIR, ['-i', '--forceExit', './foo/bar.js']);

  expect(result.status).toBe(1);
  expect(result.stdout).toMatch(/No tests found([\S\s]*)2 files checked./);
  expect(result.stderr).toEqual('');
});
