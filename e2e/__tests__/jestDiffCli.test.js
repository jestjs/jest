/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import execa from 'execa';
import {tmpdir} from 'os';
import {resolve} from 'path';
import {wrap} from 'jest-snapshot-serializer-raw';
import stripAnsi from 'strip-ansi';

import {cleanup, writeFiles} from '../Utils';

const DIR = resolve(tmpdir(), 'jest-diff-cli');
const JEST_DIFF = resolve(
  __dirname,
  '../../packages/jest-diff/bin/jest-diff.js',
);

beforeAll(() =>
  writeFiles(DIR, {
    'a.json': '[42, {"a": true}]',
    'b.json': '[1337, {"b": false}]',
    'not.json': 'not JSON',
  }),
);
afterAll(() => cleanup(DIR));

test('equal', async () => {
  const {code, stdout} = await execa(JEST_DIFF, ['a.json', 'a.json'], {
    cwd: DIR,
  });
  expect(code).toBe(0);
  expect(stdout).toBe('');
});

test('different', async () => {
  const {code, stdout} = await execa(JEST_DIFF, ['a.json', 'b.json'], {
    cwd: DIR,
    reject: false,
  });
  expect(code).toBe(1);
  expect(wrap(stripAnsi(stdout))).toMatchSnapshot();
});

// --- IO-related ---

test('file does not exist', async () => {
  const {code, stderr} = await execa(JEST_DIFF, ['a.json', 'nope.jpg'], {
    cwd: DIR,
    reject: false,
  });
  expect(code).toBe(20);
  expect(stderr).toMatch(/no such file.*nope\.jpg/);
});

test('not JSON', async () => {
  const {code, stderr} = await execa(JEST_DIFF, ['a.json', 'not.json'], {
    cwd: DIR,
    reject: false,
  });
  expect(code).toBe(30);
  expect(stderr).toMatch(/Failed to parse.*JSON/);
});

// --- CLI-related ---

describe('invalid usage', () => {
  test('too few arguments', async () => {
    const {code, stderr} = await execa(JEST_DIFF, ['a'], {reject: false});
    expect(code).toBe(2);
    expect(stderr).toEqual(
      expect.stringContaining('Not enough non-option arguments'),
    );
  });

  test('too many arguments', async () => {
    const {code, stderr} = await execa(JEST_DIFF, ['a', 'b', 'c'], {
      reject: false,
    });
    expect(code).toBe(2);
    expect(stderr).toEqual(
      expect.stringContaining('Too many non-option arguments'),
    );
  });
});

test('version', async () => {
  const {code, stdout} = await execa(JEST_DIFF, ['-v']);
  expect(code).toBe(0);
  expect(stdout).toMatch(/\d{2}\.\d{1,2}\.\d{1,2}[\-\S]*/);
});

test('help', async () => {
  const {code, stdout} = await execa(JEST_DIFF, ['-h']);
  expect(code).toBe(0);
  expect(wrap(stdout)).toMatchSnapshot();
});
