/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import {
  type SnapshotData,
  getSnapshotData,
  keyToNameOccurrence,
  keyToTestName,
  saveSnapshotFile,
  testNameToKey,
} from '@jest/snapshot-utils';
import type {Config} from '@jest/types';
import {getStackTraceLines, getTopFrame} from 'jest-message-util';
import {saveInlineSnapshots} from './InlineSnapshots';
import type {InlineSnapshot, SnapshotFormat} from './types';
import {
  addExtraLineBreaks,
  removeExtraLineBreaks,
  removeLinesBeforeExternalMatcherTrap,
  serialize,
} from './utils';
export type SnapshotStateOptions = {
  readonly updateSnapshot: Config.SnapshotUpdateState;
  readonly prettierPath?: string | null;
  readonly expand?: boolean;
  readonly snapshotFormat: SnapshotFormat;
  readonly rootDir: string;
};

export type SnapshotMatchOptions = {
  readonly testName: string;
  readonly testIdentity?: object;
  readonly nameOccurrence?: number;
  readonly received: unknown;
  readonly key?: string;
  readonly inlineSnapshot?: string;
  readonly isInline: boolean;
  readonly error?: Error;
  readonly testFailing?: boolean;
};

export type SnapshotFailOptions = {
  readonly testName: string;
  readonly testIdentity?: object;
  readonly nameOccurrence?: number;
  readonly key?: string;
};

type SnapshotReturnOptions = {
  readonly actual: string;
  readonly count: number;
  readonly expected?: string;
  readonly key: string;
  readonly pass: boolean;
};

type SaveStatus = {
  deleted: boolean;
  saved: boolean;
};

type SnapshotCounts = {
  added: number;
  matched: number;
  unmatched: number;
  updated: number;
};

// The dirty flag is monotonic, so undoing it per test needs proof that no
// other test wrote in between: the value it had before this test's first
// write, and how many of the writes since then were this test's own.
type AttemptWrites = {
  dirtyBefore: boolean;
  ownWrites: number;
  writeCountBefore: number;
};

// Everything a single test contributed since its current attempt began, so a
// retry can undo exactly that much and leave the other tests' work alone.
type AttemptRecord = {
  checkedKeys: Set<string>;
  counters: Map<string, number | undefined>;
  counts: SnapshotCounts;
  fileSnapshots: Map<string, string | undefined>;
  inlineSnapshots: Set<InlineSnapshot>;
  writes: AttemptWrites | undefined;
};

export default class SnapshotState {
  private _counters: Map<string, number>;
  private _dirty: boolean;
  private readonly _updateSnapshot: Config.SnapshotUpdateState;
  private readonly _snapshotData: SnapshotData;
  private readonly _snapshotPath: string;
  private _inlineSnapshots: Array<InlineSnapshot>;
  private _attemptRecordsByTest: WeakMap<object, AttemptRecord>;
  private _writeCount: number;
  private readonly _uncheckedKeys: Set<string>;
  private readonly _prettierPath: string | null;
  private readonly _rootDir: string;

  readonly snapshotFormat: SnapshotFormat;

  added: number;
  expand: boolean;
  matched: number;
  unmatched: number;
  updated: number;

  constructor(snapshotPath: string, options: SnapshotStateOptions) {
    this._snapshotPath = snapshotPath;
    const {data, dirty} = getSnapshotData(
      this._snapshotPath,
      options.updateSnapshot,
    );
    this._snapshotData = data;
    this._dirty = dirty;
    this._prettierPath = options.prettierPath ?? null;
    this._inlineSnapshots = [];
    this._attemptRecordsByTest = new WeakMap();
    this._writeCount = 0;
    this._uncheckedKeys = new Set(Object.keys(this._snapshotData));
    this._counters = new Map();
    this.expand = options.expand || false;
    this.added = 0;
    this.matched = 0;
    this.unmatched = 0;
    this._updateSnapshot = options.updateSnapshot;
    this.updated = 0;
    this.snapshotFormat = options.snapshotFormat;
    this._rootDir = options.rootDir;
  }

  markSnapshotsAsCheckedForTest(
    testName: string,
    nameOccurrence?: number,
  ): void {
    for (const uncheckedKey of this._uncheckedKeys) {
      const keyTestName = keyToTestName(uncheckedKey);
      // A hint is joined onto the test name with ': ' before the key is built,
      // so the recovered name of a hinted snapshot is longer than the name the
      // runner reports for the test that took it.
      if (
        keyTestName !== testName &&
        !keyTestName.startsWith(`${testName}: `)
      ) {
        continue;
      }
      // Without a position there is nothing to tell namesakes apart with, so
      // the name claims every key under it.
      if (
        nameOccurrence !== undefined &&
        keyToNameOccurrence(uncheckedKey) !== nameOccurrence
      ) {
        continue;
      }
      this._uncheckedKeys.delete(uncheckedKey);
    }
  }

  private _addSnapshot(
    key: string,
    receivedSerialized: string,
    options: {
      error?: Error;
      isInline: boolean;
      testIdentity?: object;
    },
  ): void {
    const record = this._recordFor(options.testIdentity);
    if (record !== undefined) {
      record.writes ??= {
        dirtyBefore: this._dirty,
        ownWrites: 0,
        writeCountBefore: this._writeCount,
      };
      record.writes.ownWrites++;
    }
    this._writeCount++;
    this._dirty = true;
    if (options.isInline) {
      // eslint-disable-next-line unicorn/error-message
      const error = options.error || new Error();
      const lines = getStackTraceLines(
        removeLinesBeforeExternalMatcherTrap(error.stack || ''),
      );
      const frame = getTopFrame(lines);
      if (!frame) {
        throw new Error(
          "Jest: Couldn't infer stack frame for inline snapshot.",
        );
      }
      const inlineSnapshot = {
        frame,
        snapshot: receivedSerialized,
      };
      this._inlineSnapshots.push(inlineSnapshot);
      record?.inlineSnapshots.add(inlineSnapshot);
    } else {
      // A retried attempt must not leave its writes behind, or the next attempt
      // sees the key as pre-existing and reports it as matched, not written.
      if (record !== undefined && !record.fileSnapshots.has(key)) {
        record.fileSnapshots.set(key, this._snapshotData[key]);
      }
      this._snapshotData[key] = receivedSerialized;
    }
  }

  private _recordFor(testIdentity?: object): AttemptRecord | undefined {
    if (testIdentity === undefined) {
      return undefined;
    }
    let record = this._attemptRecordsByTest.get(testIdentity);
    if (record === undefined) {
      record = {
        checkedKeys: new Set(),
        counters: new Map(),
        counts: {added: 0, matched: 0, unmatched: 0, updated: 0},
        fileSnapshots: new Map(),
        inlineSnapshots: new Set(),
        writes: undefined,
      };
      this._attemptRecordsByTest.set(testIdentity, record);
    }
    return record;
  }

  // `match` marks a key as checked so it is not reported obsolete. A key only
  // reached on a discarded attempt has to go back to being unchecked.
  private _markKeyChecked(key: string, testIdentity?: object): void {
    if (this._uncheckedKeys.delete(key)) {
      this._recordFor(testIdentity)?.checkedKeys.add(key);
    }
  }

  // A test's counter has to be its own, or namesakes take each other's keys in
  // whatever order they happen to run. The occurrence is what separates them,
  // and leads so the pair is recoverable from the string.
  private static _counterKey(testName: string, nameOccurrence = 1): string {
    return `${nameOccurrence} ${testName}`;
  }

  // Undoing an increment could undo more than this test's own, so the record
  // keeps each counter's value from before the test first touched it.
  private _bumpCounter(
    testName: string,
    nameOccurrence: number | undefined,
    testIdentity?: object,
  ): number {
    const counterKey = SnapshotState._counterKey(testName, nameOccurrence);
    const record = this._recordFor(testIdentity);
    if (record !== undefined && !record.counters.has(counterKey)) {
      record.counters.set(counterKey, this._counters.get(counterKey));
    }
    const count = (this._counters.get(counterKey) ?? 0) + 1;
    this._counters.set(counterKey, count);
    return count;
  }

  clear(testIdentity?: object): void {
    if (testIdentity === undefined) {
      this._counters = new Map();
      // TODO(jest next major): require `testIdentity` and drop this branch.
      // Unlike the per-test path below it rolls back neither file snapshot
      // data nor unchecked keys, so a snapshot added before the reset is
      // reported as matched and one it checked is never reported obsolete.
      this._inlineSnapshots = [];
      this._attemptRecordsByTest = new WeakMap();
      this.added = 0;
      this.matched = 0;
      this.unmatched = 0;
      this.updated = 0;
      return;
    }

    const record = this._attemptRecordsByTest.get(testIdentity);
    if (record === undefined) {
      return;
    }
    this._attemptRecordsByTest.delete(testIdentity);

    this._inlineSnapshots = this._inlineSnapshots.filter(
      snapshot => !record.inlineSnapshots.has(snapshot),
    );
    this.added -= record.counts.added;
    this.matched -= record.counts.matched;
    this.unmatched -= record.counts.unmatched;
    this.updated -= record.counts.updated;
    for (const [key, previous] of record.fileSnapshots) {
      if (previous === undefined) {
        delete this._snapshotData[key];
      } else {
        this._snapshotData[key] = previous;
      }
    }
    for (const key of record.checkedKeys) {
      this._uncheckedKeys.add(key);
    }
    for (const [counterKey, previous] of record.counters) {
      if (previous === undefined) {
        this._counters.delete(counterKey);
      } else {
        this._counters.set(counterKey, previous);
      }
    }
    // The dirty flag can only be undone when every write since this test's
    // first was its own; a foreign write in between keeps the flag earned.
    const writes = record.writes;
    if (
      writes !== undefined &&
      this._writeCount - writes.writeCountBefore === writes.ownWrites
    ) {
      this._dirty = writes.dirtyBefore;
      this._writeCount = writes.writeCountBefore;
    }
  }

  private _incrementSnapshotCount(
    status: keyof SnapshotCounts,
    testIdentity?: object,
  ): void {
    this[status]++;
    const record = this._recordFor(testIdentity);
    if (record !== undefined) {
      record.counts[status]++;
    }
  }

  save(): SaveStatus {
    const hasExternalSnapshots = Object.keys(this._snapshotData).length;
    const hasInlineSnapshots = this._inlineSnapshots.length;
    const isEmpty = !hasExternalSnapshots && !hasInlineSnapshots;

    const status: SaveStatus = {
      deleted: false,
      saved: false,
    };

    if ((this._dirty || this._uncheckedKeys.size > 0) && !isEmpty) {
      if (hasExternalSnapshots) {
        saveSnapshotFile(this._snapshotData, this._snapshotPath);
      }
      if (hasInlineSnapshots) {
        saveInlineSnapshots(
          this._inlineSnapshots,
          this._rootDir,
          this._prettierPath,
        );
      }
      status.saved = true;
    } else if (!hasExternalSnapshots && fs.existsSync(this._snapshotPath)) {
      if (this._updateSnapshot === 'all') {
        fs.unlinkSync(this._snapshotPath);
      }
      status.deleted = true;
    }

    return status;
  }

  getUncheckedCount(): number {
    return this._uncheckedKeys.size || 0;
  }

  getUncheckedKeys(): Array<string> {
    return [...this._uncheckedKeys];
  }

  removeUncheckedKeys(): void {
    if (this._updateSnapshot === 'all' && this._uncheckedKeys.size > 0) {
      this._dirty = true;
      for (const key of this._uncheckedKeys) delete this._snapshotData[key];
      this._uncheckedKeys.clear();
    }
  }

  match({
    testName,
    testIdentity,
    nameOccurrence,
    received,
    key,
    inlineSnapshot,
    isInline,
    error,
    testFailing = false,
  }: SnapshotMatchOptions): SnapshotReturnOptions {
    const count = this._bumpCounter(testName, nameOccurrence, testIdentity);

    if (!key) {
      key = testNameToKey(testName, count, nameOccurrence);
    }

    // Do not mark the snapshot as "checked" if the snapshot is inline and
    // there's an external snapshot. This way the external snapshot can be
    // removed with `--updateSnapshot`.
    if (!(isInline && this._snapshotData[key] !== undefined)) {
      this._markKeyChecked(key, testIdentity);
    }

    const receivedSerialized = addExtraLineBreaks(
      serialize(received, undefined, this.snapshotFormat),
    );
    const expected = isInline ? inlineSnapshot : this._snapshotData[key];
    const pass = expected === receivedSerialized;
    const hasSnapshot = expected !== undefined;
    const snapshotIsPersisted = isInline || fs.existsSync(this._snapshotPath);

    if (pass && !isInline) {
      // Executing a snapshot file as JavaScript and writing the strings back
      // when other snapshots have changed loses the proper escaping for some
      // characters. Since we check every snapshot in every test, use the newly
      // generated formatted string.
      // Note that this is only relevant when a snapshot is added and the dirty
      // flag is set.
      this._snapshotData[key] = receivedSerialized;
    }

    // In pure matching only runs, return the match result while skipping any updates
    // reports.
    if (testFailing) {
      if (hasSnapshot && !isInline) {
        // Retain current snapshot values.
        this._addSnapshot(key, expected, {error, isInline, testIdentity});
      }
      return {
        actual: removeExtraLineBreaks(receivedSerialized),
        count,
        expected:
          expected === undefined ? undefined : removeExtraLineBreaks(expected),
        key,
        pass,
      };
    }

    // These are the conditions on when to write snapshots:
    //  * There's no snapshot file in a non-CI environment.
    //  * There is a snapshot file and we decided to update the snapshot.
    //  * There is a snapshot file, but it doesn't have this snapshot.
    // These are the conditions on when not to write snapshots:
    //  * The update flag is set to 'none'.
    //  * There's no snapshot file or a file without this snapshot on a CI environment.
    if (
      (hasSnapshot && this._updateSnapshot === 'all') ||
      ((!hasSnapshot || !snapshotIsPersisted) &&
        (this._updateSnapshot === 'new' || this._updateSnapshot === 'all'))
    ) {
      if (this._updateSnapshot === 'all') {
        if (pass) {
          this._incrementSnapshotCount('matched', testIdentity);
        } else {
          if (hasSnapshot) {
            this._incrementSnapshotCount('updated', testIdentity);
          } else {
            this._incrementSnapshotCount('added', testIdentity);
          }
          this._addSnapshot(key, receivedSerialized, {
            error,
            isInline,
            testIdentity,
          });
        }
      } else {
        this._addSnapshot(key, receivedSerialized, {
          error,
          isInline,
          testIdentity,
        });
        this._incrementSnapshotCount('added', testIdentity);
      }

      return {
        actual: '',
        count,
        expected: '',
        key,
        pass: true,
      };
    } else {
      if (pass) {
        this._incrementSnapshotCount('matched', testIdentity);
        return {
          actual: '',
          count,
          expected: '',
          key,
          pass: true,
        };
      } else {
        this._incrementSnapshotCount('unmatched', testIdentity);
        return {
          actual: removeExtraLineBreaks(receivedSerialized),
          count,
          expected:
            expected === undefined
              ? undefined
              : removeExtraLineBreaks(expected),
          key,
          pass: false,
        };
      }
    }
  }

  fail({
    testName,
    testIdentity,
    nameOccurrence,
    key,
  }: SnapshotFailOptions): string {
    const count = this._bumpCounter(testName, nameOccurrence, testIdentity);

    if (!key) {
      key = testNameToKey(testName, count, nameOccurrence);
    }

    this._markKeyChecked(key, testIdentity);
    this._incrementSnapshotCount('unmatched', testIdentity);
    return key;
  }
}
