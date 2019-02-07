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
import stripAnsi from 'strip-ansi';
import {cleanup, writeFiles} from '../Utils';

const DIR = path.resolve(os.tmpdir(), 'multi-project-runner-test2');

const SAMPLE_FILE_CONTENT = 'module.exports = {};';

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('objects in project configuration', () => {
  writeFiles(DIR, {
    '__tests__/file1.test.js': `
      test('foo', () => {});
    `,
    '__tests__/file2.test.js': `
      test('bar', () => {});
    `,
    'jest.config.js': `module.exports = {
      projects: [
        { testMatch: ['<rootDir>/__tests__/file1.test.js'] },
        { testMatch: ['<rootDir>/__tests__/file2.test.js'] },
      ]
    };`,
    'package.json': '{}',
  });

  const {stdout, stderr, status} = runJest(DIR, ['--no-watchman']);
  expect(stderr).toContain('Test Suites: 2 passed, 2 total');
  expect(stderr).toContain('PASS __tests__/file1.test.js');
  expect(stderr).toContain('PASS __tests__/file2.test.js');
  expect(stderr).toContain('Ran all test suites in 2 projects.');
  expect(stdout).toEqual('');
  expect(status).toEqual(0);
});

test('allows a single project', () => {
  writeFiles(DIR, {
    '__tests__/file1.test.js': `
      test('foo', () => {});
    `,
    'jest.config.js': `module.exports = {
      projects: [
        { testMatch: ['<rootDir>/__tests__/file1.test.js'] },
      ]
    };`,
    'package.json': '{}',
  });

  const {stdout, stderr, status} = runJest(DIR, ['--no-watchman']);
  expect(stderr).toContain('PASS __tests__/file1.test.js');
  expect(stderr).toContain('Test Suites: 1 passed, 1 total');
  expect(stdout).toEqual('');
  expect(status).toEqual(0);
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
  ({stderr} = runJest(DIR, ['--no-watchman']));

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

  ({stderr} = runJest(DIR, ['--no-watchman']));
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

  ({stderr} = stripAnsi(runJest(DIR, ['--no-watchman'])));
  expect(stderr).toMatch(
    /Whoops! Two projects resolved to the same config path/,
  );
  expect(stderr).toMatch(`${path.join(DIR, 'package.json')}`);
  expect(stderr).toMatch(/Project 1|2: dir1/);
  expect(stderr).toMatch(/Project 1|2: dir2/);

  // project with a directory/file that does not exist
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

  ({stderr} = runJest(DIR, ['--no-watchman']));
  expect(stderr).toMatch(
    `Can't find a root directory while resolving a config file path.`,
  );
  expect(stderr).toMatch(/banana/);
});

test('Does transform files with the corresponding project transformer', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    'file.js': SAMPLE_FILE_CONTENT,
    'package.json': '{}',
    'project1/__tests__/project1.test.js': `
      const file = require('../../file.js');
      test('file', () => expect(file).toBe('PROJECT1'));
    `,
    'project1/jest.config.js': `
      module.exports = {
        rootDir: './',
        transform: {'file\.js': './transformer.js'},
      };`,
    'project1/transformer.js': `
      module.exports = {
        process: () => 'module.exports = "PROJECT1";',
        getCacheKey: () => 'PROJECT1_CACHE_KEY',
      }
    `,
    'project2/__tests__/project2.test.js': `
      const file = require('../../file.js');
      test('file', () => expect(file).toBe('PROJECT2'));
    `,
    'project2/jest.config.js': `
      module.exports = {
        rootDir: './',
        transform: {'file\.js': './transformer.js'},
      };`,
    'project2/transformer.js': `
      module.exports = {
        process: () => 'module.exports = "PROJECT2";',
        getCacheKey: () => 'PROJECT2_CACHE_KEY',
      }
    `,
  });

  const {stderr} = runJest(DIR, [
    '--no-watchman',
    '-i',
    '--projects',
    'project1',
    'project2',
  ]);

  expect(stderr).toMatch('Ran all test suites in 2 projects.');
  expect(stderr).toMatch('PASS project1/__tests__/project1.test.js');
  expect(stderr).toMatch('PASS project2/__tests__/project2.test.js');
});

describe("doesn't bleed module file extensions resolution with multiple workers", () => {
  test('external config files', () => {
    writeFiles(DIR, {
      '.watchmanconfig': '',
      'file.js': 'module.exports = "file1"',
      'file.p2.js': 'module.exports = "file2"',
      'package.json': '{}',
      'project1/__tests__/project1.test.js': `
      const file = require('../../file');
      test('file 1', () => expect(file).toBe('file1'));
    `,
      'project1/jest.config.js': `
      module.exports = {
        rootDir: '..',
      };`,
      'project2/__tests__/project2.test.js': `
      const file = require('../../file');
      test('file 2', () => expect(file).toBe('file2'));
    `,
      'project2/jest.config.js': `
      module.exports = {
        rootDir: '..',
        moduleFileExtensions: ['p2.js', 'js']
      };`,
    });

    const {stdout: configOutput} = runJest(DIR, [
      '--show-config',
      '--projects',
      'project1',
      'project2',
    ]);

    const {configs} = JSON.parse(configOutput);

    expect(configs).toHaveLength(2);

    const [{name: name1}, {name: name2}] = configs;

    expect(name1).toEqual(expect.any(String));
    expect(name2).toEqual(expect.any(String));
    expect(name1).toHaveLength(32);
    expect(name2).toHaveLength(32);
    expect(name1).not.toEqual(name2);

    const {stderr} = runJest(DIR, [
      '--no-watchman',
      '-w=2',
      '--projects',
      'project1',
      'project2',
    ]);

    expect(stderr).toMatch('Ran all test suites in 2 projects.');
    expect(stderr).toMatch('PASS project1/__tests__/project1.test.js');
    expect(stderr).toMatch('PASS project2/__tests__/project2.test.js');
  });

  test('inline config files', () => {
    writeFiles(DIR, {
      '.watchmanconfig': '',
      'file.js': 'module.exports = "file1"',
      'file.p2.js': 'module.exports = "file2"',
      'package.json': JSON.stringify({
        jest: {projects: [{}, {moduleFileExtensions: ['p2.js', 'js']}]},
      }),
      'project1/__tests__/project1.test.js': `
      const file = require('../../file');
      test('file 1', () => expect(file).toBe('file1'));
    `,
      'project2/__tests__/project2.test.js': `
      const file = require('../../file');
      test('file 2', () => expect(file).toBe('file2'));
    `,
    });

    const {stdout: configOutput} = runJest(DIR, ['--show-config']);

    const {configs} = JSON.parse(configOutput);

    expect(configs).toHaveLength(2);

    const [{name: name1}, {name: name2}] = configs;

    expect(name1).toEqual(expect.any(String));
    expect(name2).toEqual(expect.any(String));
    expect(name1).toHaveLength(32);
    expect(name2).toHaveLength(32);
    expect(name1).not.toEqual(name2);

    const {stderr} = runJest(DIR, ['--no-watchman', '-w=2']);

    expect(stderr).toMatch('Ran all test suites in 2 projects.');
    expect(stderr).toMatch('PASS project1/__tests__/project1.test.js');
    expect(stderr).toMatch('PASS project2/__tests__/project2.test.js');
  });
});
