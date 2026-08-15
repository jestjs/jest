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
expect(1).toMatchInlineSnapshot();
`,
  );
  const snapshotState = makeSnapshotState(rootDir, 'all');
  const retainedOwner = {};
  const retriedOwner = {};

  snapshotState.match({
    error: makeErrorAt(filename, 1),
    inlineSnapshot: '"outdated"',
    isInline: true,
    received: 'updated',
    testName: 'updated snapshot',
    testRetryOwner: retainedOwner,
  });
  snapshotState.match({
    error: makeErrorAt(filename, 2),
    isInline: true,
    received: 'added',
    testName: 'added snapshot',
    testRetryOwner: retainedOwner,
  });
  snapshotState.match({
    error: makeErrorAt(filename, 3),
    isInline: true,
    received: 'retry',
    testName: 'retried snapshot',
    testRetryOwner: retriedOwner,
  });

  expect(snapshotState.added).toBe(2);
  expect(snapshotState.updated).toBe(1);

  snapshotState.clear(retriedOwner);

  expect(snapshotState.added).toBe(1);
  expect(snapshotState.updated).toBe(1);
  expect(snapshotState.save()).toEqual({deleted: false, saved: true});
  expect(fs.readFileSync(filename, 'utf8')).toBe(
    `expect(1).toMatchInlineSnapshot(\`"updated"\`);
expect(1).toMatchInlineSnapshot(\`"added"\`);
expect(1).toMatchInlineSnapshot();
`,
  );
});

test('clear without an owner removes all pending inline snapshots', () => {
  const filename = path.join(rootDir, 'example.test.js');
  fs.writeFileSync(filename, 'expect(1).toMatchInlineSnapshot();\n');
  const snapshotState = makeSnapshotState(rootDir, 'new');

  snapshotState.match({
    error: makeErrorAt(filename, 1),
    isInline: true,
    received: 'added',
    testName: 'added snapshot',
    testRetryOwner: {},
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
