/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const path = require('path');
const {makeTemplate, writeFiles, cleanup} = require('../Utils');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../toMatchSnapshotAndLog');
const TESTS_DIR = path.resolve(DIR, '__tests__');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

test('basic support', () => {
  const filename = 'basic-support.test.js';
  const template = makeTemplate(`test('works fine when function throws error', () => {
       expect('this is the value').toMatchSnapshotAndLog();
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template()});
    const {stdout, stderr, status} = runJest(DIR, [
      '-w=1',
      '--ci=false',
      filename,
    ]);
    expect(stdout).toMatch('this is the value');
    expect(stderr).toMatch('1 snapshot written in 1 test suite.');
    expect(status).toBe(0);
  }
});

test('accepts custom snapshot name', () => {
  const filename = 'accept-custom-snapshot-name.test.js';
  const template = makeTemplate(`test('accepts custom snapshot name', () => {
      expect('this is the value').toMatchSnapshotAndLog('custom-name');
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template()});
    const {stdout, stderr, status} = runJest(DIR, [
      '-w=1',
      '--ci=false',
      filename,
    ]);
    expect(stdout).toMatch('this is the value');
    expect(stderr).toMatch('1 snapshot written in 1 test suite.');
    expect(status).toBe(0);
  }
});

test('cannot be used with .not', () => {
  const filename = 'cannot-be-used-with-not.test.js';
  const template = makeTemplate(`test('cannot be used with .not', () => {
       expect('this is the value').not.toMatchSnapshotAndLog();
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template()});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch(
      'Jest: `.not` cannot be used with `.toMatchSnapshotAndLog()`.',
    );
    expect(status).toBe(1);
  }
});
