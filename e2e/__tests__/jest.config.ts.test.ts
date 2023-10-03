/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {cleanup, extractSummary, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../jest-config-ts');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('works with jest.config.ts', () => {
  writeFiles(DIR, {
    '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
    'jest.config.ts':
      "export default {testEnvironment: 'jest-environment-node', testRegex: '.*-giraffe.js'};",
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  expect(exitCode).toBe(0);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('works with tsconfig.json', () => {
  writeFiles(DIR, {
    '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
    'jest.config.ts':
      "export default {testEnvironment: 'jest-environment-node', testRegex: '.*-giraffe.js'};",
    'package.json': '{}',
    'tsconfig.json': '{ "compilerOptions": { "module": "esnext" } }',
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  expect(exitCode).toBe(0);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('traverses directory tree up until it finds jest.config', () => {
  writeFiles(DIR, {
    '__tests__/a-giraffe.js': `
    const slash = require('slash');
    test('giraffe', () => expect(1).toBe(1));
    test('abc', () => console.log(slash(process.cwd())));
    `,
    'jest.config.ts':
      "export default {testEnvironment: 'jest-environment-node', testRegex: '.*-giraffe.js'};",
    'package.json': '{}',
    'some/nested/directory/file.js': '// nothing special',
  });

  const {stderr, exitCode, stdout} = runJest(
    path.join(DIR, 'some', 'nested', 'directory'),
    ['-w=1', '--ci=false'],
    {skipPkgJsonCheck: true},
  );

  // Snapshot the console.logged `process.cwd()` and make sure it stays the same
  expect(
    stdout
      .replace(/^\W+(.*)e2e/gm, '<<REPLACED>>')
      .replace('at Object.<anonymous> (__tests__', 'at Object.call (__tests__'),
  ).toMatchSnapshot();

  const {rest, summary} = extractSummary(stderr);
  expect(exitCode).toBe(0);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('it does type check the config', () => {
  writeFiles(DIR, {
    '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
    'jest.config.ts': 'export default { testTimeout: "10000" }',
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  expect(stderr).toMatch('must be of type');
  expect(exitCode).toBe(1);
});

test('invalid JS in jest.config.ts', () => {
  writeFiles(DIR, {
    '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
    'jest.config.ts': "export default i'll break this file yo",
    'package.json': '{}',
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
  expect(stderr).toMatch('TSError: ⨯ Unable to compile TypeScript:');
  expect(exitCode).toBe(1);
});
