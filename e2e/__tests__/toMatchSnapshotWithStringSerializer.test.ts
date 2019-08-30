/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {cleanup, makeTemplate, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(
  __dirname,
  '../to-match-snapshot-with-string-serializer',
);
const TESTS_DIR = path.resolve(DIR, '__tests__');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

test('empty external', () => {
  // Make sure empty string as expected value of external snapshot
  // is not confused with new snapshot not written because of --ci option.
  const filename = 'empty-external.test.js';
  const template = makeTemplate(
    `test('string serializer', () => { expect($1).toMatchSnapshot(); })`,
  );

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['""']), // empty string
    });
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(status).toBe(0);
  }

  {
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(stderr).not.toMatch('1 snapshot written from 1 test suite.');
    expect(status).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['"non-empty"']),
    });
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 failed, 1 total');
    expect(stderr).not.toMatch('not written'); // not confused with --ci option
    expect(stderr).toMatch(/- Snapshot|Snapshot:/); // ordinary report
    expect(status).toBe(1);
  }
});
