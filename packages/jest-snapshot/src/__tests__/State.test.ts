/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
import SnapshotState from '../State';

const makeErrorAt = (filename: string, line: number): Error => {
  const error = new Error();
  error.stack = `Error\n    at Object.<anonymous> (${filename}:${line}:11)`;
  return error;
};

const makeSnapshotState = (
  rootDir: string,
  updateSnapshot: 'all' | 'new',
): SnapshotState =>
  new SnapshotState(path.join(rootDir, 'unused.snap'), {
    rootDir,
    snapshotFormat: {},
    updateSnapshot,
  });

let rootDir: string;

beforeEach(() => {
  rootDir = fs.mkdtempSync(path.join(tmpdir(), 'jest-snapshot-state-test-'));
});

afterEach(() => {
  fs.rmSync(rootDir, {recursive: true});
});

test('clear preserves inline snapshots owned by other tests', () => {
  const filename = path.join(rootDir, 'example.test.js');
  fs.writeFileSync(
    filename,
    `expect(1).toMatchInlineSnapshot(\`"outdated"\`);
expect(1).toMatchInlineSnapshot();
expect(1).toMatchInlineSnapshot(\`"outdated"\`);
expect(1).toMatchInlineSnapshot();
`,
  );
  const snapshotState = makeSnapshotState(rootDir, 'all');
  const retainedTest = {};
  const retriedTest = {};

  snapshotState.match({
    error: makeErrorAt(filename, 1),
    inlineSnapshot: '"outdated"',
    isInline: true,
    received: 'updated',
    testIdentity: retainedTest,
    testName: 'updated snapshot',
  });
  snapshotState.match({
    error: makeErrorAt(filename, 2),
    isInline: true,
    received: 'added',
    testIdentity: retainedTest,
    testName: 'added snapshot',
  });
  snapshotState.match({
    error: makeErrorAt(filename, 3),
    inlineSnapshot: '"outdated"',
    isInline: true,
    received: 'updated on retry',
    testIdentity: retriedTest,
    testName: 'updated snapshot on retry',
  });
  snapshotState.match({
    error: makeErrorAt(filename, 4),
    isInline: true,
    received: 'retry',
    testIdentity: retriedTest,
    testName: 'retried snapshot',
  });
  snapshotState.match({
    inlineSnapshot: '"matched"',
    isInline: true,
    received: 'matched',
    testIdentity: retainedTest,
    testName: 'retained match',
  });
  snapshotState.match({
    inlineSnapshot: '"matched"',
    isInline: true,
    received: 'matched',
    testIdentity: retriedTest,
    testName: 'retried match',
  });
  snapshotState.fail('retained failure', undefined, undefined, retainedTest);
  snapshotState.fail('retried failure', undefined, undefined, retriedTest);

  expect(snapshotState.added).toBe(2);
  expect(snapshotState.matched).toBe(2);
  expect(snapshotState.unmatched).toBe(2);
  expect(snapshotState.updated).toBe(2);

  snapshotState.clear(retriedTest);

  expect(snapshotState.added).toBe(1);
  expect(snapshotState.matched).toBe(1);
  expect(snapshotState.unmatched).toBe(1);
  expect(snapshotState.updated).toBe(1);
  expect(snapshotState.save()).toEqual({deleted: false, saved: true});
  expect(fs.readFileSync(filename, 'utf8')).toBe(
    `expect(1).toMatchInlineSnapshot(\`"updated"\`);
expect(1).toMatchInlineSnapshot(\`"added"\`);
expect(1).toMatchInlineSnapshot(\`"outdated"\`);
expect(1).toMatchInlineSnapshot();
`,
  );
});

test('does not save when the only writes were rolled back', () => {
  const snapshotPath = path.join(rootDir, 'example.test.js.snap');
  fs.writeFileSync(
    snapshotPath,
    '// Jest Snapshot v1, https://jestjs.io/docs/snapshot-testing\n\nexports[`existing 1`] = `"kept"`;\n',
  );
  const snapshotState = new SnapshotState(snapshotPath, {
    rootDir,
    snapshotFormat: {},
    updateSnapshot: 'new',
  });
  const retriedTest = {};

  snapshotState.match({
    isInline: false,
    received: 'kept',
    testName: 'existing',
  });
  snapshotState.match({
    isInline: false,
    received: 'discarded',
    testIdentity: retriedTest,
    testName: 'written on retry',
  });
  snapshotState.clear(retriedTest);

  const modifiedBefore = fs.statSync(snapshotPath).mtimeMs;
  expect(snapshotState.save()).toEqual({deleted: false, saved: false});
  expect(fs.statSync(snapshotPath).mtimeMs).toBe(modifiedBefore);
});

test('still saves when another test wrote between the rolled-back writes', () => {
  const snapshotPath = path.join(rootDir, 'example.test.js.snap');
  fs.writeFileSync(
    snapshotPath,
    '// Jest Snapshot v1, https://jestjs.io/docs/snapshot-testing\n\nexports[`existing 1`] = `"kept"`;\n',
  );
  const snapshotState = new SnapshotState(snapshotPath, {
    rootDir,
    snapshotFormat: {},
    updateSnapshot: 'new',
  });
  const retriedTest = {};

  snapshotState.match({
    isInline: false,
    received: 'kept',
    testName: 'existing',
  });
  snapshotState.match({
    isInline: false,
    received: 'discarded',
    testIdentity: retriedTest,
    testName: 'written on retry',
  });
  snapshotState.match({
    isInline: false,
    received: 'other',
    testIdentity: {},
    testName: 'written by another test',
  });
  snapshotState.clear(retriedTest);

  expect(snapshotState.save()).toEqual({deleted: false, saved: true});
  const snapshotFile = fs.readFileSync(snapshotPath, 'utf8');
  expect(snapshotFile).toContain('exports[`written by another test 1`]');
  expect(snapshotFile).not.toContain('written on retry');
});

test('clear without a test identity removes all pending inline snapshots', () => {
  const filename = path.join(rootDir, 'example.test.js');
  fs.writeFileSync(filename, 'expect(1).toMatchInlineSnapshot();\n');
  const snapshotState = makeSnapshotState(rootDir, 'new');

  snapshotState.match({
    error: makeErrorAt(filename, 1),
    isInline: true,
    received: 'added',
    testIdentity: {},
    testName: 'added snapshot',
  });
  expect(snapshotState.added).toBe(1);

  snapshotState.clear();

  expect(snapshotState.added).toBe(0);
  expect(snapshotState.updated).toBe(0);
  expect(snapshotState.save()).toEqual({deleted: false, saved: false});
  expect(fs.readFileSync(filename, 'utf8')).toBe(
    'expect(1).toMatchInlineSnapshot();\n',
  );
});
