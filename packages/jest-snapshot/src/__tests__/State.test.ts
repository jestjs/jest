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

test('returns the snapshot path only for external snapshots', () => {
  const snapshotPath = path.join(rootDir, 'example.test.js.snap');
  const snapshotState = new SnapshotState(snapshotPath, {
    rootDir,
    snapshotFormat: {},
    updateSnapshot: 'none',
  });

  const externalResult = snapshotState.match({
    isInline: false,
    received: 'actual',
    testName: 'external snapshot',
  });
  const inlineResult = snapshotState.match({
    inlineSnapshot: '"expected"',
    isInline: true,
    received: 'actual',
    testName: 'inline snapshot',
  });

  expect(externalResult.snapshotPath).toBe(snapshotPath);
  expect(inlineResult).not.toHaveProperty('snapshotPath');
});

test('returns the snapshot path for failing external test.failing snapshots only', () => {
  const missingSnapshotPath = path.join(rootDir, 'missing.test.js.snap');
  const failingSnapshotState = new SnapshotState(missingSnapshotPath, {
    rootDir,
    snapshotFormat: {},
    updateSnapshot: 'none',
  });
  const matchingSnapshotPath = path.join(rootDir, 'matching.test.js.snap');
  fs.writeFileSync(
    matchingSnapshotPath,
    '// Jest Snapshot v1, https://jestjs.io/docs/snapshot-testing\n\nexports[`matching 1`] = `"actual"`;\n',
  );
  const matchingSnapshotState = new SnapshotState(matchingSnapshotPath, {
    rootDir,
    snapshotFormat: {},
    updateSnapshot: 'none',
  });

  const failedExternalResult = failingSnapshotState.match({
    isInline: false,
    received: 'actual',
    testFailing: true,
    testName: 'missing',
  });
  const matchedExternalResult = matchingSnapshotState.match({
    isInline: false,
    received: 'actual',
    testFailing: true,
    testName: 'matching',
  });
  const failedInlineResult = failingSnapshotState.match({
    inlineSnapshot: '"expected"',
    isInline: true,
    received: 'actual',
    testFailing: true,
    testName: 'inline',
  });

  expect(failedExternalResult.snapshotPath).toBe(missingSnapshotPath);
  expect(matchedExternalResult).not.toHaveProperty('snapshotPath');
  expect(failedInlineResult).not.toHaveProperty('snapshotPath');
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

describe('markSnapshotsAsCheckedForTest', () => {
  // Only a key the test never reached is still unchecked by the time the
  // runner asks — `match` claims the rest as it goes.
  const stateWithKeys = (keys: Array<string>) => {
    const snapshotPath = path.join(rootDir, 'example.test.js.snap');
    fs.writeFileSync(
      snapshotPath,
      `// Jest Snapshot v1, https://jestjs.io/docs/snapshot-testing\n\n${keys
        .map(key => `exports[\`${key}\`] = \`"value"\`;\n`)
        .join('\n')}`,
    );
    return new SnapshotState(snapshotPath, {
      rootDir,
      snapshotFormat: {},
      updateSnapshot: 'none',
    });
  };

  test('claims the keys the test took under its own name', () => {
    const snapshotState = stateWithKeys(['a test 1', 'a test 2']);

    snapshotState.markSnapshotsAsCheckedForTest('a test');

    expect(snapshotState.getUncheckedKeys()).toEqual([]);
  });

  test('claims the keys the test took under a hint', () => {
    const snapshotState = stateWithKeys(['a test: hint 1', 'a test: other 1']);

    snapshotState.markSnapshotsAsCheckedForTest('a test');

    expect(snapshotState.getUncheckedKeys()).toEqual([]);
  });

  test('leaves the keys of every other test alone', () => {
    const snapshotState = stateWithKeys([
      'a test 1',
      'a test: hint 1',
      'a test extra 1',
      'another test 1',
      'a tes 1',
    ]);

    snapshotState.markSnapshotsAsCheckedForTest('a test');

    // `a test extra` is a separate test whose name merely starts the same way:
    // only a ': ' after the full name marks a hint.
    expect(snapshotState.getUncheckedKeys()).toEqual([
      'a test extra 1',
      'another test 1',
      'a tes 1',
    ]);
  });

  test('cannot tell a hint from a test whose name contains the separator', () => {
    const snapshotState = stateWithKeys(['a: b 1']);

    snapshotState.markSnapshotsAsCheckedForTest('a');

    // A key left by a removed `test('a: b')` is indistinguishable from a hinted
    // snapshot of `test('a')`, so it is claimed and never reported obsolete.
    // Telling them apart needs ownership the key format does not record.
    expect(snapshotState.getUncheckedKeys()).toEqual([]);
  });
});
