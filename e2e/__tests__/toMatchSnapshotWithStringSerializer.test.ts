/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {cleanup, makeTemplate, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(
  __dirname,
  '../to-match-snapshot-with-string-serializer',
);
const TESTS_DIR = path.resolve(DIR, '__tests__');

const readFile = (filename: string) =>
  fs.readFileSync(path.join(TESTS_DIR, filename), 'utf8');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

// Because the not written error might include Received,
// match Snapshot as either diff annotation or concise label.
const ORDINARY_FAILURE = /- Snapshot|Snapshot:/;

const NOT_WRITTEN = 'not written'; // new snapshot with --ci option

test('empty external', () => {
  // Make sure empty string as expected value of external snapshot
  // is not confused with new snapshot not written because of --ci option.
  const filename = 'empty-external.test.js';
  const template = makeTemplate(
    "test('string serializer', () => { expect($1).toMatchSnapshot(); })",
  );

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(["''"]),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }

  {
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(stderr).not.toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(["'non-empty'"]),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 failed, 1 total');
    expect(stderr).not.toMatch('not written'); // not confused with --ci option
    expect(stderr).toMatch(ORDINARY_FAILURE);
    expect(exitCode).toBe(1);
  }
});

test('empty internal ci false', () => {
  // Make sure empty string as expected value of internal snapshot
  // is not confused with absence of snapshot.
  const filename = 'empty-internal-ci-false.test.js';
  const template = makeTemplate(
    "test('string serializer', () => { expect($1).toMatchInlineSnapshot(); })",
  );

  const received1 = "''";
  const received2 = "'non-empty'";

  {
    writeFiles(TESTS_DIR, {
      [filename]: template([received1]),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: readFile(filename).replace(received1, received2),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 failed, 1 total');
    expect(stderr).not.toMatch('1 snapshot written from 1 test suite.');
    expect(stderr).toMatch(ORDINARY_FAILURE);
    expect(exitCode).toBe(1);
  }
});

test('undefined internal ci true', () => {
  // Make sure absence of internal snapshot
  // is not confused with ordinary failure for empty string as expected value.
  const filename = 'undefined-internal-ci-true.test.js';
  const template = makeTemplate(
    "test('explicit update', () => { expect($1).toMatchInlineSnapshot(); })",
  );

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(["'non-empty'"]),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=true', filename]);
    expect(stderr).toMatch('Snapshots:   1 failed, 1 total');
    expect(stderr).not.toMatch(ORDINARY_FAILURE);
    expect(stderr).toMatch(NOT_WRITTEN);
    expect(exitCode).toBe(1);
  }
});
