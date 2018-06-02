/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import runJest from '../runJest';
import os from 'os';
import path from 'path';

const {cleanup, writeFiles, extractSummary} = require('../Utils');

const DIR = path.resolve(os.tmpdir(), 'find_related_tests_test');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

describe('--findRelatedTests flag', () => {
  test('runs tests related to filename', () => {
    writeFiles(DIR, {
      '.watchmanconfig': '',
      '__tests__/test.test.js': `
      const a = require('../a');
      test('a', () => {});
    `,
      'a.js': 'module.exports = {};',
      'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
    });

    const {stdout} = runJest(DIR, ['a.js']);
    expect(stdout).toMatch('');

    const {stderr} = runJest(DIR, ['--findRelatedTests', 'a.js']);
    expect(stderr).toMatch('PASS __tests__/test.test.js');

    const summaryMsg = 'Ran all test suites related to files matching /a.js/i.';
    expect(stderr).toMatch(summaryMsg);
  });

  test('generates coverage report for filename', () => {
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
      'package.json': JSON.stringify({
        jest: {collectCoverage: true, testEnvironment: 'node'},
      }),
    });

    let stdout;
    let stderr;

    ({stdout, stderr} = runJest(DIR));
    let summary;
    let rest;
    ({summary, rest} = extractSummary(stderr));
    expect(summary).toMatchSnapshot();
    expect(
      rest
        .split('\n')
        .map(s => s.trim())
        .sort()
        .join('\n'),
    ).toMatchSnapshot();

    // both a.js and b.js should be in the coverage
    expect(stdout).toMatchSnapshot();

    ({stdout, stderr} = runJest(DIR, ['--findRelatedTests', 'a.js']));

    ({summary, rest} = extractSummary(stderr));

    expect(summary).toMatchSnapshot();
    // should only run a.js
    expect(rest).toMatchSnapshot();
    // coverage should be collected only for a.js
    expect(stdout).toMatchSnapshot();
  });
});
