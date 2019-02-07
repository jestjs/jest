/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import runJest from '../runJest';
import os from 'os';
import path from 'path';
import {cleanup, extractSummary, sortLines, writeFiles} from '../Utils';
import {wrap} from 'jest-snapshot-serializer-raw';

const DIR = path.resolve(os.tmpdir(), 'multi-project-runner-test');

const SAMPLE_FILE_CONTENT = 'module.exports = {};';

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('--listTests doesnt duplicate the test files', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '/project1.js': `module.exports = {rootDir: './', displayName: 'BACKEND'}`,
    '/project2.js': `module.exports = {rootDir: './', displayName: 'BACKEND'}`,
    '__tests__/inBothProjectsTest.js': `test('test', () => {});`,
    'package.json': JSON.stringify({
      jest: {projects: ['<rootDir>/project1.js', '<rootDir>/project2.js']},
    }),
  });

  const {stdout} = runJest(DIR, ['--listTests']);
  expect(stdout.split('\n')).toHaveLength(1);
  expect(stdout).toMatch('inBothProjectsTest.js');
});

test('can pass projects or global config', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    'base_config.js': `
      module.exports = {
        haste: {
          hasteImplModulePath: '<rootDir>/hasteImpl.js',
        },
      };
    `,
    'hasteImpl.js': `
      const path = require('path');
      module.exports = {
        getHasteName(filename) {
          return filename
            .substr(filename.lastIndexOf(path.sep) + 1)
            .replace(/\.js$/, '');
        },
      };
    `,
    'package.json': '{}',
    'project1/__tests__/file1.test.js': `
      const file1 = require('file1');
      test('file1', () => {});
    `,
    'project1/file1.js': SAMPLE_FILE_CONTENT,
    'project1/jest.config.js': `module.exports = {rootDir: './', displayName: 'BACKEND',         haste: {
              hasteImplModulePath: '<rootDir>/../hasteImpl.js',
            },}`,
    'project2/__tests__/file1.test.js': `
      const file1 = require('file1');
      test('file1', () => {});
    `,
    'project2/file1.js': SAMPLE_FILE_CONTENT,
    'project2/jest.config.js': `module.exports = {rootDir: './',         haste: {
              hasteImplModulePath: '<rootDir>/../hasteImpl.js',
            },}`,
    'project3/__tests__/file1.test.js': `
      const file1 = require('file1');
      test('file1', () => {});
    `,
    'project3/file1.js': SAMPLE_FILE_CONTENT,
    'project3/jest.config.js': `module.exports = {rootDir: './', displayName: 'UI',         haste: {
              hasteImplModulePath: '<rootDir>/../hasteImpl.js',
            },}`,
  });
  let stderr;

  ({stderr} = runJest(DIR, ['--no-watchman', '--config', 'base_config.js']));
  expect(stderr).toMatch(
    'The name `file1` was looked up in the Haste module map. It cannot be resolved, because there exists several different files',
  );

  expect(wrap(extractSummary(stderr).summary)).toMatchSnapshot();

  writeFiles(DIR, {
    'global_config.js': `
      module.exports = {
        projects: ['project1/', 'project2/', 'project3/'],
        haste: {
          hasteImplModulePath: '<rootDir>/hasteImpl.js',
        },
      };
    `,
  });

  ({stderr} = runJest(DIR, [
    '--no-watchman',
    '-i',
    '--projects',
    'project1',
    'project2',
    'project3',
    '--config',
    'base_config.js',
  ]));

  const result1 = extractSummary(stderr);
  expect(wrap(result1.summary)).toMatchSnapshot();
  expect(wrap(sortLines(result1.rest))).toMatchSnapshot();

  ({stderr} = runJest(DIR, [
    '--no-watchman',
    '-i',
    '--config',
    'global_config.js',
  ]));
  const result2 = extractSummary(stderr);

  expect(wrap(result2.summary)).toMatchSnapshot();
  expect(wrap(sortLines(result2.rest))).toMatchSnapshot();

  // make sure different ways of passing projects work exactly the same
  expect(result1.summary).toBe(result2.summary);
  expect(sortLines(result1.rest)).toBe(sortLines(result2.rest));
});

test('"No tests found" message for projects', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    'package.json': '{}',
    'project1/__tests__/file1.test.js': `
      const file1 = require('../file1');
      test('file1', () => {});
    `,
    'project1/file1.js': SAMPLE_FILE_CONTENT,
    'project1/jest.config.js': `module.exports = {rootDir: './'}`,
    'project2/__tests__/file1.test.js': `
      const file1 = require('../file1');
      test('file1', () => {});
    `,
    'project2/file1.js': SAMPLE_FILE_CONTENT,
    'project2/jest.config.js': `module.exports = {rootDir: './'}`,
  });
  const {stdout: verboseOutput} = runJest(DIR, [
    '--no-watchman',
    'xyz321',
    '--verbose',
    '--projects',
    'project1',
    'project2',
  ]);
  expect(verboseOutput).toContain('Pattern: xyz321 - 0 matches');
  const {stdout} = runJest(DIR, [
    '--no-watchman',
    'xyz321',
    '--projects',
    'project1',
    'project2',
  ]);
  expect(stdout).toContain(
    '  6 files checked across 2 projects. ' +
    'Run with `--verbose` for more details.',
  );
});

test('projects can be workspaces with non-JS/JSON files', () => {
  writeFiles(DIR, {
    'package.json': JSON.stringify({
      jest: {
        projects: ['packages/*'],
      },
    }),
    'packages/README.md': '# Packages README',
    'packages/project1/README.md': '# Project1 README',
    'packages/project1/__tests__/file1.test.js': `
    const file1 = require('../file1');
    test('file1', () => {});
    `,
    'packages/project1/file1.js': SAMPLE_FILE_CONTENT,
    'packages/project1/package.json': '{}',
    'packages/project2/__tests__/file2.test.js': `
    const file2 = require('../file2');
    test('file2', () => {});
    `,
    'packages/project2/file2.js': SAMPLE_FILE_CONTENT,
    'packages/project2/package.json': '{}',
  });

  const {status, stdout, stderr} = runJest(DIR, ['--no-watchman']);

  expect(stderr).toContain('Test Suites: 2 passed, 2 total');
  expect(stderr).toContain('PASS packages/project1/__tests__/file1.test.js');
  expect(stderr).toContain('PASS packages/project2/__tests__/file2.test.js');
  expect(stderr).toContain('Ran all test suites in 2 projects.');
  expect(stdout).toEqual('');
  expect(status).toEqual(0);
});
