/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

import runJest from '../runJest';
import {cleanup, extractSummary, writeFiles} from '../utils';
import os from 'os';
import path from 'path';

const skipOnWindows = require('skipOnWindows');
const DIR = path.resolve(os.tmpdir(), 'multi_project_runner_test');

skipOnWindows.suite();

const fileContentWithProvidesModule = name => `/*
 * @providesModule ${name}
 */

module.exports = {};
`;

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

// Since Jest does not guarantee the order of tests we'll sort the output.
const sortLines = output =>
  output
    .split(/\n/)
    .sort()
    .map(str => str.trim())
    .filter(str => Boolean(str))
    .join('\n');

test('can pass projects or global config', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    'package.json': '{}',
    'project1/__tests__/file1.test.js': `
      const file1 = require('file1');
      test('file1', () => {});
    `,
    'project1/file1.js': fileContentWithProvidesModule('file1'),
    'project1/jest.config.js': `module.exports = {rootDir: './'}`,
    'project2/__tests__/file1.test.js': `
      const file1 = require('file1');
      test('file1', () => {});
    `,
    'project2/file1.js': fileContentWithProvidesModule('file1'),
    'project2/jest.config.js': `module.exports = {rootDir: './'}`,
  });
  let stderr;

  ({stderr} = runJest(DIR));
  expect(stderr).toMatch(
    'The name `file1` was looked up in the Haste module map. It cannot be resolved, because there exists several different files',
  );

  expect(extractSummary(stderr).summary).toMatchSnapshot();

  writeFiles(DIR, {
    'global_config.js': `
      module.exports = {
        projects: ['project1/', 'project2/'],
      };
    `,
  });

  ({stderr} = runJest(DIR, ['-i', '--projects', 'project1', 'project2']));

  const result1 = extractSummary(stderr);
  expect(result1.summary).toMatchSnapshot();
  expect(sortLines(result1.rest)).toMatchSnapshot();

  ({stderr} = runJest(DIR, ['-i', '--config', 'global_config.js']));
  const result2 = extractSummary(stderr);

  expect(result2.summary).toMatchSnapshot();
  expect(sortLines(result2.rest)).toMatchSnapshot();

  // make sure different ways of passing projects work exactly the same
  expect(result1.summary).toBe(result2.summary);
  expect(sortLines(result1.rest)).toBe(sortLines(result2.rest));
});
