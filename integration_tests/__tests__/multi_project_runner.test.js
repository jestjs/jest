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

import runJest from '../runJest';
import {cleanup, extractSummary, writeFiles} from '../utils';
import os from 'os';
import path from 'path';

const skipOnWindows = require('../../scripts/skip_on_windows');
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
    'project1/jest.config.js': `module.exports = {rootDir: './', displayName: 'BACKEND'}`,
    'project2/__tests__/file1.test.js': `
      const file1 = require('file1');
      test('file1', () => {});
    `,
    'project2/file1.js': fileContentWithProvidesModule('file1'),
    'project2/jest.config.js': `module.exports = {rootDir: './'}`,
    'project3/__tests__/file1.test.js': `
      const file1 = require('file1');
      test('file1', () => {});
    `,
    'project3/file1.js': fileContentWithProvidesModule('file1'),
    'project3/jest.config.js': `module.exports = {rootDir: './', displayName: 'UI'}`,
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
        projects: ['project1/', 'project2/', 'project3/'],
      };
    `,
  });

  ({stderr} = runJest(DIR, [
    '-i',
    '--projects',
    'project1',
    'project2',
    'project3',
  ]));

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

test('resolves projects and their <rootDir> properly', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    'package.json': JSON.stringify({
      jest: {
        projects: [
          'project1.conf.json',
          '<rootDir>/project2/project2.conf.json',
        ],
      },
    }),
    'project1.conf.json': JSON.stringify({
      name: 'project1',
      rootDir: './project1',
      // root dir should be this project's directory
      setupFiles: ['<rootDir>/project1_setup.js'],
      testEnvironment: 'node',
    }),
    'project1/__tests__/test.test.js': `test('project1', () => expect(global.project1).toBe(true))`,
    'project1/project1_setup.js': 'global.project1 = true;',
    'project2/__tests__/test.test.js': `test('project2', () => expect(global.project2).toBe(true))`,
    'project2/project2.conf.json': JSON.stringify({
      name: 'project2',
      rootDir: '../', // root dir is set to the top level
      setupFiles: ['<rootDir>/project2/project2_setup.js'], // rootDir shold be of the
      testEnvironment: 'node',
      testPathIgnorePatterns: ['project1'],
    }),
    'project2/project2_setup.js': 'global.project2 = true;',
  });

  let stderr;
  ({stderr} = runJest(DIR));

  expect(stderr).toMatch('Ran all test suites in 2 projects.');
  expect(stderr).toMatch('PASS project1/__tests__/test.test.js');
  expect(stderr).toMatch('PASS project2/__tests__/test.test.js');

  // Use globs
  writeFiles(DIR, {
    'dir1/random_file': '',
    'dir2/random_file': '',
    'package.json': JSON.stringify({
      jest: {
        projects: ['**/*.conf.json'],
      },
    }),
  });

  ({stderr} = runJest(DIR));
  expect(stderr).toMatch('Ran all test suites in 2 projects.');
  expect(stderr).toMatch('PASS project1/__tests__/test.test.js');
  expect(stderr).toMatch('PASS project2/__tests__/test.test.js');

  // Include two projects that will resolve to the same config
  writeFiles(DIR, {
    'dir1/random_file': '',
    'dir2/random_file': '',
    'package.json': JSON.stringify({
      jest: {
        projects: [
          'dir1',
          'dir2',
          'project1.conf.json',
          '<rootDir>/project2/project2.conf.json',
        ],
      },
    }),
  });

  ({stderr} = runJest(DIR));
  expect(stderr).toMatch(
    /One or more specified projects share the same config file/,
  );

  // praject with a directory/file that does not exist
  writeFiles(DIR, {
    'package.json': JSON.stringify({
      jest: {
        projects: [
          'banana',
          'project1.conf.json',
          '<rootDir>/project2/project2.conf.json',
        ],
      },
    }),
  });

  ({stderr} = runJest(DIR));
  expect(stderr).toMatch(
    `Can't find a root directory while resolving a config file path.`,
  );
  expect(stderr).toMatch(/banana/);
});
