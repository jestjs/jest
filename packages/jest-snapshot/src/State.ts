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
  readonly testRetryOwner?: object;
  readonly received: unknown;
  readonly key?: string;
  readonly inlineSnapshot?: string;
  readonly isInline: boolean;
  readonly error?: Error;
  readonly testFailing?: boolean;
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

// Everything a single test contributed since its current attempt began, so a
// retry can undo exactly that much and leave the other tests' work alone.
type AttemptRecord = {
  checkedKeys: Set<string>;
  counts: SnapshotCounts;
  fileSnapshots: Map<string, string | undefined>;
  inlineSnapshots: Set<InlineSnapshot>;
};

export default class SnapshotState {
  private _counters: Map<string, number>;
  private _dirty: boolean;
  private readonly _updateSnapshot: Config.SnapshotUpdateState;
  private _snapshotData: SnapshotData;
  private readonly _snapshotPath: string;
  private _inlineSnapshots: Array<InlineSnapshot>;
  private _attemptRecordsByTest: WeakMap<object, AttemptRecord>;
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

  markSnapshotsAsCheckedForTest(testName: string): void {
    for (const uncheckedKey of this._uncheckedKeys) {
      if (keyToTestName(uncheckedKey) === testName) {
        this._uncheckedKeys.delete(uncheckedKey);
      }
    }
  }

  private _addSnapshot(
    key: string,
    receivedSerialized: string,
    options: {
      error?: Error;
      isInline: boolean;
      testRetryOwner?: object;
    },
  ): void {
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
      this._recordFor(options.testRetryOwner)?.inlineSnapshots.add(
        inlineSnapshot,
      );
    } else {
      // A retried attempt must not leave its writes behind, or the next attempt
      // sees the key as pre-existing and reports it as matched, not written.
      const fileSnapshots = this._recordFor(
        options.testRetryOwner,
      )?.fileSnapshots;
      if (fileSnapshots !== undefined && !fileSnapshots.has(key)) {
        fileSnapshots.set(key, this._snapshotData[key]);
      }
      this._snapshotData[key] = receivedSerialized;
    }
  }

  private _recordFor(testRetryOwner?: object): AttemptRecord | undefined {
    if (testRetryOwner === undefined) {
      return undefined;
    }
    let record = this._attemptRecordsByTest.get(testRetryOwner);
    if (record === undefined) {
      record = {
        checkedKeys: new Set(),
        counts: {added: 0, matched: 0, unmatched: 0, updated: 0},
        fileSnapshots: new Map(),
        inlineSnapshots: new Set(),
      };
      this._attemptRecordsByTest.set(testRetryOwner, record);
    }
    return record;
  }

  // `match` marks a key as checked so it is not reported obsolete. A key only
  // reached on a discarded attempt has to go back to being unchecked.
  private _markKeyChecked(key: string, testRetryOwner?: object): void {
    if (this._uncheckedKeys.delete(key)) {
      this._recordFor(testRetryOwner)?.checkedKeys.add(key);
    }
  }

  clear(testRetryOwner?: object): void {
    this._counters = new Map();

    if (testRetryOwner === undefined) {
      // TODO(jest next major): require `testRetryOwner` and drop this branch.
      // Unlike the per-owner path below it rolls back neither file snapshot
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

    const record = this._attemptRecordsByTest.get(testRetryOwner);
    if (record === undefined) {
      return;
    }
    this._attemptRecordsByTest.delete(testRetryOwner);

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
  }

  private _incrementSnapshotCount(
    status: keyof SnapshotCounts,
    testRetryOwner?: object,
  ): void {
    this[status]++;
    const record = this._recordFor(testRetryOwner);
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
    testRetryOwner,
    received,
    key,
    inlineSnapshot,
    isInline,
    error,
    testFailing = false,
  }: SnapshotMatchOptions): SnapshotReturnOptions {
    this._counters.set(testName, (this._counters.get(testName) || 0) + 1);
    const count = Number(this._counters.get(testName));

    if (!key) {
      key = testNameToKey(testName, count);
    }

    // Do not mark the snapshot as "checked" if the snapshot is inline and
    // there's an external snapshot. This way the external snapshot can be
    // removed with `--updateSnapshot`.
    if (!(isInline && this._snapshotData[key] !== undefined)) {
      this._markKeyChecked(key, testRetryOwner);
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
        this._addSnapshot(key, expected, {error, isInline});
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
          this._incrementSnapshotCount('matched', testRetryOwner);
        } else {
          if (hasSnapshot) {
            this._incrementSnapshotCount('updated', testRetryOwner);
          } else {
            this._incrementSnapshotCount('added', testRetryOwner);
          }
          this._addSnapshot(key, receivedSerialized, {
            error,
            isInline,
            testRetryOwner,
          });
        }
      } else {
        this._addSnapshot(key, receivedSerialized, {
          error,
          isInline,
          testRetryOwner,
        });
        this._incrementSnapshotCount('added', testRetryOwner);
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
        this._incrementSnapshotCount('matched', testRetryOwner);
        return {
          actual: '',
          count,
          expected: '',
          key,
          pass: true,
        };
      } else {
        this._incrementSnapshotCount('unmatched', testRetryOwner);
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

  fail(
    testName: string,
    _received: unknown,
    key?: string,
    testRetryOwner?: object,
  ): string {
    this._counters.set(testName, (this._counters.get(testName) || 0) + 1);
    const count = Number(this._counters.get(testName));

    if (!key) {
      key = testNameToKey(testName, count);
    }

    this._markKeyChecked(key, testRetryOwner);
    this._incrementSnapshotCount('unmatched', testRetryOwner);
    return key;
  }
}
