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

const DIR = path.resolve(__dirname, '../to-match-snapshot-with-retries');
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
    test('snapshots', () => expect($1).toMatchSnapshot());
  `);

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['3', '1' /* retries */]),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
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

test('works when multiple tests have snapshots but only one of them failed multiple times', () => {
  const filename = 'basic-support.test.js';
  const template = makeTemplate(`
    test('passing snapshots', () => expect('foo').toMatchSnapshot());
    describe('with retries', () => {
      let index = 0;
      afterEach(() => {
        index += 1;
      });
      jest.retryTimes($2);
      test('snapshots', () => expect($1).toMatchSnapshot());
    });
  `);

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['3', '2' /* retries */]),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('2 snapshots written from 1 test suite.');
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

test('preserves snapshot updates across describe and test retries', () => {
  const filename = 'entire-describe-and-test-retry.test.js';
  const template = makeTemplate(`
    jest.retryTimes(1);

    test('before external', () =>
      expect('before external').toMatchSnapshot(),
    );
    test('before inline', () =>
      expect('before inline').toMatchInlineSnapshot(),
    );

    describe('with retries', () => {
      let attempt = 0;
      jest.retryTimes(1, {entireDescribe: true});
      beforeAll(() => {
        attempt += 1;
      });
      test('suite external', () => expect(attempt).toMatchSnapshot());
      test('suite inline', () =>
        expect(\`suite \${attempt}\`).toMatchInlineSnapshot(),
      );
      test('flaky', () => expect(attempt).toBe(2));
    });

    let laterAttempt = 0;
    test('later per-test retry', () => {
      laterAttempt += 1;
      expect('later inline').toMatchInlineSnapshot();
      expect(laterAttempt).toBe(2);
    });
  `);

  writeFiles(TESTS_DIR, {[filename]: template([])});
  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
  const snapshotContents = fs.readFileSync(
    path.join(TESTS_DIR, '__snapshots__', `${filename}.snap`),
    'utf8',
  );
  const testContents = fs.readFileSync(path.join(TESTS_DIR, filename), 'utf8');

  expect(stderr).toMatch('1 snapshot written from 1 test suite.');
  expect(snapshotContents).toContain('= `"before external"`;');
  expect(snapshotContents).toContain('= `2`;');
  expect(testContents).toContain('toMatchInlineSnapshot(`"before inline"`)');
  expect(testContents).toContain('toMatchInlineSnapshot(`"suite 2"`)');
  expect(testContents).toContain('toMatchInlineSnapshot(`"later inline"`)');
  expect(testContents.match(/toMatchInlineSnapshot\(`/g)).toHaveLength(3);
  expect(exitCode).toBe(0);
});
