/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const fs = require('fs');
const path = require('path');
const {makeTemplate, writeFiles, cleanup} = require('../Utils');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../toMatchInlineSnapshot');
const TESTS_DIR = path.resolve(DIR, '__tests__');

const readFile = filename =>
  fs.readFileSync(path.join(TESTS_DIR, filename), 'utf8');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

test('basic support', () => {
  const filename = 'basic-support.test.js';
  const template = makeTemplate(
    `test('inline snapshots', () => expect($1).toMatchInlineSnapshot());\n`,
  );

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['{apple: "original value"}']),
    });
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    const fileAfter = readFile(filename);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(status).toBe(0);
    expect(fileAfter).toMatchSnapshot('initial write');
  }

  {
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    const fileAfter = readFile(filename);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(stderr).not.toMatch('1 snapshot written from 1 test suite.');
    expect(status).toBe(0);
    expect(fileAfter).toMatchSnapshot('snapshot passed');
  }

  // This test below also covers how jest-editor-support creates terse messages
  // for letting a Snapshot update, so if the wording is updated, please edit
  // /packages/jest-editor-support/src/test_reconciler.js
  {
    writeFiles(TESTS_DIR, {
      [filename]: readFile(filename).replace('original value', 'updated value'),
    });
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    const fileAfter = readFile(filename);
    expect(stderr).toMatch('Received value does not match stored snapshot');
    expect(status).toBe(1);
    expect(fileAfter).toMatchSnapshot('snapshot mismatch');
  }

  {
    const {stderr, status} = runJest(DIR, [
      '-w=1',
      '--ci=false',
      filename,
      '-u',
    ]);
    const fileAfter = readFile(filename);
    expect(stderr).toMatch('1 snapshot updated from 1 test suite.');
    expect(status).toBe(0);
    expect(fileAfter).toMatchSnapshot('snapshot updated');
  }
});

test('handles property matchers', () => {
  const filename = 'handle-property-matchers.test.js';
  const template = makeTemplate(`test('handles property matchers', () => {
      expect({createdAt: $1}).toMatchInlineSnapshot({createdAt: expect.any(Date)});
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template(['new Date()'])});
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    const fileAfter = readFile(filename);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(status).toBe(0);
    expect(fileAfter).toMatchSnapshot('initial write');
  }

  {
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    const fileAfter = readFile(filename);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(status).toBe(0);
    expect(fileAfter).toMatchSnapshot('snapshot passed');
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: readFile(filename).replace('new Date()', '"string"'),
    });
    const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    const fileAfter = readFile(filename);
    expect(stderr).toMatch(
      'Received value does not match snapshot properties for "handles property matchers 1".',
    );
    expect(stderr).toMatch('Snapshots:   1 failed, 1 total');
    expect(status).toBe(1);
    expect(fileAfter).toMatchSnapshot('snapshot failed');
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: readFile(filename).replace('any(Date)', 'any(String)'),
    });
    const {stderr, status} = runJest(DIR, [
      '-w=1',
      '--ci=false',
      filename,
      '-u',
    ]);
    const fileAfter = readFile(filename);
    expect(stderr).toMatch('1 snapshot updated from 1 test suite.');
    expect(status).toBe(0);
    expect(fileAfter).toMatchSnapshot('snapshot updated');
  }
});

test('supports async matchers', () => {
  const filename = 'async-matchers.test.js';
  const test = `
    test('inline snapshots', async () => {
      expect(Promise.resolve('success')).resolves.toMatchInlineSnapshot();
      expect(Promise.reject('fail')).rejects.toMatchInlineSnapshot();
    });
  `;

  writeFiles(TESTS_DIR, {[filename]: test});
  const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
  const fileAfter = readFile(filename);
  expect(stderr).toMatch('2 snapshots written from 1 test suite.');
  expect(status).toBe(0);
  expect(fileAfter).toMatchSnapshot();
});

test('supports async tests', () => {
  const filename = 'async.test.js';
  const test = `
    test('inline snapshots', async () => {
      await 'next tick';
      expect(42).toMatchInlineSnapshot();
    });
  `;

  writeFiles(TESTS_DIR, {[filename]: test});
  const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false', filename]);
  const fileAfter = readFile(filename);
  expect(stderr).toMatch('1 snapshot written from 1 test suite.');
  expect(status).toBe(0);
  expect(fileAfter).toMatchSnapshot();
});
