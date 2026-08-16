/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
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

test('keeps snapshot counts from other tests when a test retries', () => {
  const filename = 'counts-across-retries.test.js';
  const template = makeTemplate(`
    test('passing snapshot', () => expect('foo').toMatchSnapshot());

    describe('with retries', () => {
      let index = 0;
      afterEach(() => {
        index += 1;
      });
      jest.retryTimes(4);
      test('flaky snapshot', () => expect(index).toMatchSnapshot());
    });
  `);

  writeFiles(TESTS_DIR, {
    [filename]: template([]),
    [`__snapshots__/${filename}.snap`]: `// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[\`with retries flaky snapshot 1\`] = \`3\`;
`,
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);

  expect(exitCode).toBe(0);
  expect(stderr).toMatch('1 snapshot written from 1 test suite.');
  expect(stderr).toMatch('Snapshots:   1 written, 1 passed, 2 total');
});

test('reports a snapshot added on a discarded attempt as written', () => {
  const filename = 'written-on-retry.test.js';
  const template = makeTemplate(`
    let index = 0;
    afterEach(() => {
      index += 1;
    });
    jest.retryTimes(1);
    test('existing', () => expect('old').toMatchSnapshot());
    test('adds a new snapshot then fails once', () => {
      expect('brand new').toMatchSnapshot();
      expect(index).toBe(2);
    });
  `);

  writeFiles(TESTS_DIR, {
    [filename]: template([]),
    [`__snapshots__/${filename}.snap`]: `// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[\`existing 1\`] = \`"old"\`;
`,
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);

  expect(exitCode).toBe(0);
  expect(stderr).toMatch('1 snapshot written from 1 test suite.');
  expect(stderr).toMatch('Snapshots:   1 written, 1 passed, 2 total');
});

test('still reports a snapshot only reached on a discarded attempt as obsolete', () => {
  const filename = 'obsolete-across-retries.test.js';
  const template = makeTemplate(`
    let attempt = 0;
    jest.retryTimes(1);
    test('varies', () => {
      attempt += 1;
      expect('a').toMatchSnapshot();
      if (attempt === 1) {
        expect('b').toMatchSnapshot();
        throw new Error('fail once');
      }
    });
  `);

  writeFiles(TESTS_DIR, {
    [filename]: template([]),
    [`__snapshots__/${filename}.snap`]: `// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[\`varies 1\`] = \`"a"\`;

exports[\`varies 2\`] = \`"b"\`;
`,
  });

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);

  // Matches a run without retries: an obsolete snapshot is reported and fails
  // the run, even though every test passed.
  expect(exitCode).toBe(1);
  expect(stderr).toMatch('Snapshots:   1 obsolete, 1 passed, 1 total');
});

test('scopes retry cleanup to the test, not its enclosing hooks', () => {
  const filename = 'hook-snapshots-on-retry.test.js';
  const template = makeTemplate(`
    let attempt = 0;
    jest.retryTimes(1);

    describe('suite', () => {
      beforeAll(() => {
        expect('from beforeAll').toMatchSnapshot();
      });
      beforeEach(() => {
        expect('from beforeEach').toMatchSnapshot();
      });
      test('flaky', () => {
        attempt += 1;
        expect('from test').toMatchSnapshot();
        expect(attempt).toBe(2);
      });
    });
  `);

  writeFiles(TESTS_DIR, {[filename]: template([])});

  const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);

  // `beforeAll` runs outside the test, so its snapshot is written once and
  // survives the retry. The `beforeEach` and test snapshots belong to the test,
  // so the discarded attempt's copies are rolled back and written once each.
  expect(exitCode).toBe(0);
  expect(stderr).toMatch('3 snapshots written from 1 test suite.');
  expect(stderr).toMatch('Snapshots:   3 written, 3 total');
});

test('keeps concurrent tests independent when one of them retries', () => {
  const filename = 'concurrent-snapshots-on-retry.test.js';
  const template = makeTemplate(`
    let attempt = 0;
    jest.retryTimes(1);

    test.concurrent('steady', async () => {
      expect('steady value').toMatchSnapshot();
    });
    test.concurrent('flaky', async () => {
      attempt += 1;
      expect('flaky value').toMatchSnapshot();
      expect(attempt).toBe(2);
    });
  `);

  writeFiles(TESTS_DIR, {[filename]: template([])});

  const {stderr, exitCode} = runJest(DIR, [
    '-w=1',
    '--maxConcurrency=1',
    '--ci=false',
    filename,
  ]);

  expect(exitCode).toBe(0);
  expect(stderr).toMatch('2 snapshots written from 1 test suite.');
  expect(stderr).toMatch('Snapshots:   2 written, 2 total');
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
    expect(stderr).toMatch('Snapshots:   2 passed, 2 total');
    expect(exitCode).toBe(0);
  }
});
