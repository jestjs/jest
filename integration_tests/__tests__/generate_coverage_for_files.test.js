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
const {cleanup, writeFiles, extractSummary} = require('../utils');
const runJest = require('../runJest');

const DIR = path.resolve(os.tmpdir(), 'generate_coverage_for_files_test');

skipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('--generateCoverageForFiles', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/a.test.js': `
      require('../a');
      require('../b');
      test('a', () => expect(1).toBe(1));
    `,
    '__tests__/b.test.js': `
      require('../b');
      test('b', () => expect(1).toBe(1));
    `,
    'a.js': 'module.exports = {}',
    'b.js': 'module.exports = {}',
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  let stdout;
  let stderr;

  ({stdout, stderr} = runJest(DIR, ['--coverage']));
  let summary;
  let rest;
  ({summary, rest} = extractSummary(stderr));
  expect(summary).toMatchSnapshot();
  expect(
    rest.split('\n').map(s => s.trim()).sort().join('\n'),
  ).toMatchSnapshot();
  // both a.js and b.js should be in the coverage
  expect(stdout).toMatchSnapshot();

  ({stdout, stderr} = runJest(DIR, ['--generateCoverageForFiles', 'a.js']));

  ({summary, rest} = extractSummary(stderr));

  expect(summary).toMatchSnapshot();
  // should only run a.js
  expect(rest).toMatchSnapshot();
  // coverage should be collected only for a.js
  expect(stdout).toMatchSnapshot();
});
