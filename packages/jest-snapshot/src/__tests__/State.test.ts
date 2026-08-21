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
  snapshotState.fail({
    testIdentity: retainedTest,
    testName: 'retained failure',
  });
  snapshotState.fail({testIdentity: retriedTest, testName: 'retried failure'});

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

describe('tests sharing a full name', () => {
  const readKeys = (snapshotPath: string) =>
    [...fs.readFileSync(snapshotPath, 'utf8').matchAll(/^exports\[`(.+)`\]/gm)]
      .map(match => match[1])
      .sort();

  test('count their snapshots independently of run order', () => {
    const snapshotPath = path.join(rootDir, 'example.test.js.snap');
    const snapshotState = new SnapshotState(snapshotPath, {
      rootDir,
      snapshotFormat: {},
      updateSnapshot: 'new',
    });

    // The second test runs first, as `--randomize` or concurrency may order it.
    snapshotState.match({
      isInline: false,
      nameOccurrence: 2,
      received: 'from the second test',
      testIdentity: {},
      testName: 'suite same name',
    });
    snapshotState.match({
      isInline: false,
      nameOccurrence: 1,
      received: 'from the first test',
      testIdentity: {},
      testName: 'suite same name',
    });

    expect(snapshotState.added).toBe(2);
    expect(snapshotState.save()).toEqual({deleted: false, saved: true});
    expect(readKeys(snapshotPath)).toEqual([
      'suite same name 1',
      'suite same name 2.1',
    ]);
  });

  test('keep their own counters when one of them retries', () => {
    const snapshotPath = path.join(rootDir, 'example.test.js.snap');
    const snapshotState = new SnapshotState(snapshotPath, {
      rootDir,
      snapshotFormat: {},
      updateSnapshot: 'new',
    });
    const retriedTest = {};

    snapshotState.match({
      isInline: false,
      nameOccurrence: 2,
      received: 'discarded',
      testIdentity: retriedTest,
      testName: 'suite same name',
    });
    snapshotState.match({
      isInline: false,
      nameOccurrence: 1,
      received: 'from the first test',
      testIdentity: {},
      testName: 'suite same name',
    });
    snapshotState.clear(retriedTest);
    snapshotState.match({
      isInline: false,
      nameOccurrence: 2,
      received: 'from the second test',
      testIdentity: {},
      testName: 'suite same name',
    });

    expect(snapshotState.added).toBe(2);
    expect(snapshotState.save()).toEqual({deleted: false, saved: true});
    const snapshotFile = fs.readFileSync(snapshotPath, 'utf8');
    expect(snapshotFile).toContain(
      'exports[`suite same name 2.1`] = `"from the second test"`;',
    );
    expect(snapshotFile).not.toContain('discarded');
  });
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
    const snapshotState = stateWithKeys([
      'a test \u203A hint 1',
      'a test \u203A other 1',
    ]);

    snapshotState.markSnapshotsAsCheckedForTest('a test');

    expect(snapshotState.getUncheckedKeys()).toEqual([]);
  });

  test('leaves the keys of every other test alone', () => {
    const snapshotState = stateWithKeys([
      'a test 1',
      'a test \u203A hint 1',
      'a test extra 1',
      'another test 1',
      'a tes 1',
    ]);

    snapshotState.markSnapshotsAsCheckedForTest('a test');

    expect(snapshotState.getUncheckedKeys()).toEqual([
      'a test extra 1',
      'another test 1',
      'a tes 1',
    ]);
  });

  test('tells a hint from a test whose name contains a colon', () => {
    const snapshotState = stateWithKeys(['a: b 1', 'a \u203A b 1']);

    snapshotState.markSnapshotsAsCheckedForTest('a');

    // `a: b 1` was left by a removed `test('a: b')`, so it stays obsolete;
    // only the hinted key belongs to `test('a')`.
    expect(snapshotState.getUncheckedKeys()).toEqual(['a: b 1']);
  });
});
