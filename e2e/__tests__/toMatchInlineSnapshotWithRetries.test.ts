/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {cleanup, makeTemplate, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../to-match-inline-snapshot-with-retries');
const TESTS_DIR = path.resolve(DIR, '__tests__');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

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
    const {stdout, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stdout).toMatch('Snapshots:   1 passed, 1 total');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['index', '2' /* retries */]),
    });
    const {stdout, exitCode} = runJest(DIR, [
      '-w=1',
      '--ci=false',
      '--testRunner=jest-circus/runner',
      filename,
    ]);
    expect(stdout).toMatch('Received: 2');
    expect(stdout).toMatch('1 snapshot failed from 1 test suite.');
    expect(exitCode).toBe(1);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['index', '4' /* retries */]),
    });
    const {stdout, exitCode} = runJest(DIR, [
      '-w=1',
      '--ci=false',
      '--testRunner=jest-circus/runner',
      filename,
    ]);
    expect(stdout).toMatch('Snapshots:   1 passed, 1 total');
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
    const {stdout, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stdout).toMatch('Test Suites: 1 failed, 1 total');
    expect(stdout).toMatch('Snapshots:   1 passed, 1 total');
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
    const {stdout, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stdout).toMatch('Snapshots:   2 passed, 2 total');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['index', '2' /* retries */]),
    });
    const {stdout, exitCode} = runJest(DIR, [
      '-w=1',
      '--ci=false',
      '--testRunner=jest-circus/runner',
      filename,
    ]);
    expect(stdout).toMatch('Snapshot name: `with retries snapshots 1`');
    expect(stdout).toMatch('Received: 2');
    expect(stdout).toMatch('1 snapshot failed from 1 test suite.');
    expect(exitCode).toBe(1);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['index', '4' /* retries */]),
    });
    const {stdout, exitCode} = runJest(DIR, [
      '-w=1',
      '--ci=false',
      '--testRunner=jest-circus/runner',
      filename,
    ]);
    expect(stdout).toMatch('Snapshots:   1 passed, 1 total');
    expect(exitCode).toBe(0);
  }
});
