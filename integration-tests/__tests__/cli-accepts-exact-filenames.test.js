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
const skipOnWindows = require('../../scripts/skip_on_windows');
const {extractSummary, cleanup, writeFiles} = require('../utils');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../cli_accepts_exact_filenames');

skipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('CLI accepts exact filenames', () => {
  writeFiles(DIR, {
    'bar.js': `
      test('bar', () => console.log('Hey'));
    `,
    'foo/baz.js': `
      test('baz', () => console.log('Hey'));
    `,
    'package.json': '{}',
  });

  const {stderr, stdout, status} = runJest(DIR, [
    '-i',
    '--ci=false',
    '--forceExit',
    './bar.js',
    './foo/baz.js',
    './foo',
  ]);

  expect(status).toBe(0);

  const {rest, summary} = extractSummary(stderr);

  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(stdout).toMatchSnapshot();
});
