/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {cleanup, extractSummary, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../jest-config-js');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('works with jest.config.js', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': "test('banana', () => expect(1).toBe(1));",
    'jest.config.js': "module.exports = {testRegex: '.*-banana.js'};",
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  expect(exitCode).toBe(0);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('traverses directory tree up until it finds jest.config', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
    const slash = require('slash');
    test('banana', () => expect(1).toBe(1));
    test('abc', () => console.log(slash(process.cwd())));
    `,
    'jest.config.js': "module.exports = {testRegex: '.*-banana.js'};",
    'package.json': '{}',
    'some/nested/directory/file.js': '// nothing special',
  });

  const {stderr, exitCode, stdout} = runJest(
    path.join(DIR, 'some', 'nested', 'directory'),
    ['-w=1', '--ci=false'],
    {skipPkgJsonCheck: true},
  );

  // Snapshot the console.loged `process.cwd()` and make sure it stays the same
  expect(stdout.replaceAll(/^\W+(.*)e2e/gm, '<<REPLACED>>')).toMatchSnapshot();

  const {rest, summary} = extractSummary(stderr);
  expect(exitCode).toBe(0);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('invalid JS in jest.config.js', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': "test('banana', () => expect(1).toBe(1));",
    'jest.config.js': "module.exports = i'll break this file yo",
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  expect(stderr).toMatch('SyntaxError: ');
  expect(exitCode).toBe(1);
});
