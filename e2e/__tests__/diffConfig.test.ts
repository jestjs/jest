/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {cleanup, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'diff-config-test');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('custom diff annotations from config are used in failure output', () => {
  writeFiles(DIR, {
    '__tests__/test.test.js': `
      test('fails', () => {
        expect({a: 1, b: 2}).toEqual({a: 1, b: 3});
      });
    `,
    'jest.config.js': `
      module.exports = {
        diff: {
          aAnnotation: 'ExpectedCustom',
          bAnnotation: 'ReceivedCustom',
        },
        testEnvironment: 'node',
      };
    `,
    'package.json': JSON.stringify({name: 'diff-config-test'}),
  });

  const {stderr, exitCode} = runJest(DIR, ['--ci'], {stripAnsi: true});

  expect(exitCode).toBe(1);
  expect(stderr).toContain('- ExpectedCustom');
  expect(stderr).toContain('+ ReceivedCustom');
  expect(stderr).not.toContain('- Expected\n');
});

test('custom diff indicators and contextLines from config are used in failure output', () => {
  writeFiles(DIR, {
    '__tests__/test.test.js': `
      test('fails', () => {
        expect({a: 1, b: 2, c: 3, d: 4, e: 5}).toEqual({a: 1, b: 2, c: 3, d: 4, e: 6});
      });
    `,
    'jest.config.js': `
      module.exports = {
        diff: {
          aIndicator: '<<',
          bIndicator: '>>',
          contextLines: 0,
        },
        testEnvironment: 'node',
      };
    `,
    'package.json': JSON.stringify({name: 'diff-config-test'}),
  });

  const {stderr, exitCode} = runJest(DIR, ['--ci', '--no-expand'], {
    stripAnsi: true,
  });

  expect(exitCode).toBe(1);
  expect(stderr).toContain('<< Expected');
  expect(stderr).toContain('>> Received');
  // contextLines: 0 hides unchanged lines
  expect(stderr).not.toContain('"a": 1');
});

test('default diff output is used when diff is not configured', () => {
  writeFiles(DIR, {
    '__tests__/test.test.js': `
      test('fails', () => {
        expect({a: 1, b: 2}).toEqual({a: 1, b: 3});
      });
    `,
    'jest.config.js': `
      module.exports = {testEnvironment: 'node'};
    `,
    'package.json': JSON.stringify({name: 'diff-config-test'}),
  });

  const {stderr, exitCode} = runJest(DIR, ['--ci'], {stripAnsi: true});

  expect(exitCode).toBe(1);
  expect(stderr).toContain('- Expected');
  expect(stderr).toContain('+ Received');
});

test('--showConfig includes the diff option', () => {
  writeFiles(DIR, {
    '__tests__/test.test.js': "test('test', () => {});",
    'jest.config.js': `
      module.exports = {
        diff: {contextLines: 3},
        testEnvironment: 'node',
      };
    `,
    'package.json': JSON.stringify({name: 'diff-config-test'}),
  });

  const {stdout, exitCode} = runJest(DIR, ['--showConfig', '--ci']);

  expect(exitCode).toBe(0);
  expect(stdout).toContain('"diff": {');
  expect(stdout).toContain('"contextLines": 3');
});
