/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {skipSuiteOnJasmine} from '@jest/test-utils';
import {cleanup, makeTemplate, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../to-match-inline-snapshot-with-retries');
const TESTS_DIR = path.resolve(DIR, '__tests__');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

skipSuiteOnJasmine();

test('works with a single snapshot', () => {
  const filename = 'basic-support.test.js';
  const template = makeTemplate(`
    let index = 0;
    afterEach(() => {
      index += 1;
    });
    jest.retryTimes($2);
    test('snapshots', () => expect($1).toMatchInlineSnapshot(\`3\`));
  `);

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['3', '1' /* retries */]),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['index', '2' /* retries */]),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Received: 2');
    expect(stderr).toMatch('1 snapshot failed from 1 test suite.');
    expect(exitCode).toBe(1);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['index', '4' /* retries */]),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(exitCode).toBe(0);
  }
});

test('works when a different assertion is failing', () => {
  const filename = 'basic-support.test.js';
  const template = makeTemplate(`
    jest.retryTimes($1);
    test('snapshots', () => {
      expect(3).toMatchInlineSnapshot(\`3\`);
      expect(false).toBe(true);
    });
  `);

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['4']),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Test Suites: 1 failed, 1 total');
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(exitCode).toBe(1);
  }
});

test('works when multiple tests have snapshots but only one of them failed multiple times', () => {
  const filename = 'basic-support.test.js';
  const template = makeTemplate(`
    test('passing snapshots', () => expect(1).toMatchInlineSnapshot(\`1\`));
    describe('with retries', () => {
      let index = 0;
      afterEach(() => {
        index += 1;
      });
      jest.retryTimes($2);
      test('snapshots', () => expect($1).toMatchInlineSnapshot(\`3\`));
    });
  `);

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['3', '2' /* retries */]),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   2 passed, 2 total');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['index', '2' /* retries */]),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshot name: `with retries snapshots 1`');
    expect(stderr).toMatch('Received: 2');
    expect(stderr).toMatch('1 snapshot failed from 1 test suite.');
    expect(exitCode).toBe(1);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['index', '4' /* retries */]),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   2 passed, 2 total');
    expect(exitCode).toBe(0);
  }
});

test('preserves added and updated snapshots from colliding full names', () => {
  const filename = 'preserve-unrelated-inline-snapshots.test.js';
  const template = makeTemplate(`
    let attempt = 0;
    jest.retryTimes(2);

    describe('a', () => {
      test('b c', () => {
        expect('before retry').toMatchInlineSnapshot(\`"outdated"\`);
        expect('new snapshot').toMatchInlineSnapshot();
      });
    });

    describe('a b', () => {
      test('c', () => {
        attempt += 1;
        expect('retry ' + attempt).toMatchInlineSnapshot();
        expect(attempt).toBe(3);
      });
    });
  `);

  writeFiles(TESTS_DIR, {[filename]: template([])});
  const {stderr, exitCode} = runJest(DIR, [
    '-w=1',
    '--ci=false',
    '-u',
    filename,
  ]);
  const testContents = fs.readFileSync(path.join(TESTS_DIR, filename), 'utf8');

  expect(stderr).not.toContain(
    'Multiple inline snapshots for the same call are not supported.',
  );
  expect(stderr).toMatch('2 snapshots written from 1 test suite.');
  expect(stderr).toMatch('1 snapshot updated from 1 test suite.');
  expect(testContents).toContain('toMatchInlineSnapshot(`"before retry"`)');
  expect(testContents).toContain('toMatchInlineSnapshot(`"new snapshot"`)');
  expect(testContents).toContain('toMatchInlineSnapshot(`"retry 3"`)');
  expect(testContents).not.toContain('`"retry 1"`');
  expect(testContents).not.toContain('`"retry 2"`');
  expect(testContents.match(/toMatchInlineSnapshot\(`/g)).toHaveLength(3);
  expect(exitCode).toBe(0);
});
