/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {wrap} from 'jest-snapshot-serializer-raw';
import {cleanup, extractSummary, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'find-related-tests-test');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

describe('--findRelatedTests flag', () => {

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

    ({stdout, stderr} = runJest(DIR, [], {stripAnsi: true}));
    let summary;
    let rest;
    ({summary, rest} = extractSummary(stderr));
    expect(wrap(summary)).toMatchSnapshot();
    expect(
      wrap(
        rest
          .split('\n')
          .map(s => s.trim())
          .sort()
          .join('\n'),
      ),
    ).toMatchSnapshot();

    // both a.js and b.js should be in the coverage
    expect(wrap(stdout)).toMatchSnapshot();

    ({stdout, stderr} = runJest(DIR, ['--findRelatedTests', 'a.js'], {
      stripAnsi: true,
    }));

    ({summary, rest} = extractSummary(stderr));

    expect(wrap(summary)).toMatchSnapshot();
    // should only run a.js
    expect(wrap(rest)).toMatchSnapshot();
    // coverage should be collected only for a.js
    expect(wrap(stdout)).toMatchSnapshot();
  });

  test('coverage configuration is applied correctly', () => {
    writeFiles(DIR, {
      '.watchmanconfig': '',
      '__tests__/a.test.js': `
        require('../a');
        test('a', () => expect(1).toBe(1));
      `,
      'a.js': 'module.exports = {}',
      'b.js': 'module.exports = {}',
      'package.json': JSON.stringify({
        jest: {
          collectCoverage: true,
          collectCoverageFrom: ['!b.js', 'a.js'],
          testEnvironment: 'node',
        },
      }),
    });

    let stdout;
    let stderr;
    ({stdout, stderr} = runJest(DIR, ['--findRelatedTests', 'a.js', 'b.js'], {
      stripAnsi: true,
    }));

    const {summary, rest} = extractSummary(stderr);
    expect(wrap(summary)).toMatchSnapshot();
    expect(
      wrap(
        rest
          .split('\n')
          .map(s => s.trim())
          .sort()
          .join('\n'),
      ),
    ).toMatchSnapshot();

    // Only a.js should be in the report
    expect(wrap(stdout)).toMatchSnapshot();
    expect(stdout).toMatch('a.js');
    expect(stdout).not.toMatch('b.js');

    ({stdout, stderr} = runJest(DIR, ['--findRelatedTests', 'b.js']));

    // Neither a.js or b.js should be in the report
    expect(stdout).toMatch('No tests found');
    expect(stderr).toBe('');
  });
});
