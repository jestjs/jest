/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {wrap} from 'jest-snapshot-serializer-raw';
import {cleanup, makeTemplate, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../to-match-inline-snapshot');
const TESTS_DIR = path.resolve(DIR, '__tests__');

const readFile = (filename: string) =>
  fs.readFileSync(path.join(TESTS_DIR, filename), 'utf8');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

test('handles property matchers', () => {
  const filename = 'handle-property-matchers.test.js';
  const template = makeTemplate(`test('handles property matchers', () => {
      expect({createdAt: $1}).toMatchInlineSnapshot({createdAt: expect.any(Date)});
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template(['new Date()'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    const fileAfter = readFile(filename);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
    expect(wrap(fileAfter)).toMatchSnapshot('initial write');
  }

  {
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    const fileAfter = readFile(filename);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(exitCode).toBe(0);
    expect(wrap(fileAfter)).toMatchSnapshot('snapshot passed');
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: readFile(filename).replace('new Date()', '"string"'),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    const fileAfter = readFile(filename);
    expect(stderr).toMatch('Snapshot name: `handles property matchers 1`');
    expect(stderr).toMatch('Snapshots:   1 failed, 1 total');
    expect(exitCode).toBe(1);
    expect(wrap(fileAfter)).toMatchSnapshot('snapshot failed');
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: readFile(filename).replace('any(Date)', 'any(String)'),
    });
    const {stderr, exitCode} = runJest(DIR, [
      '-w=1',
      '--ci=false',
      filename,
      '-u',
    ]);
    const fileAfter = readFile(filename);
    expect(stderr).toMatch('1 snapshot updated from 1 test suite.');
    expect(exitCode).toBe(0);
    expect(wrap(fileAfter)).toMatchSnapshot('snapshot updated');
  }
});
