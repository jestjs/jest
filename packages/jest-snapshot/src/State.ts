/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import type {Config} from '@jest/types';
import {getStackTraceLines, getTopFrame} from 'jest-message-util';
import {saveInlineSnapshots} from './InlineSnapshots';
import type {
  FilePersistedSnapshotData,
  SnapshotData,
  SnapshotFormat,
  SnapshotKind,
} from './types';
import {
  addExtraLineBreaks,
  getSnapshotData,
  keyToTestName,
  removeExtraLineBreaks,
  removeLinesBeforeExternalMatcherTrap,
  saveSnapshotFile,
  serialize,
  testNameToKey,
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
  readonly received: unknown;
  readonly key?: string;
  readonly kind: SnapshotKind;
  readonly error?: Error;
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

export default class SnapshotState {
  private _counters: Map<string, number>;
  private _dirty: boolean;
  // @ts-expect-error - seemingly unused?
  private _index: number;
  private readonly _updateSnapshot: Config.SnapshotUpdateState;
  private _snapshotData: SnapshotData;
  private readonly _initialData: FilePersistedSnapshotData;
  private readonly _snapshotPath: string;
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
    this._initialData = data;
    this._snapshotData = {...data, inline: []};
    this._dirty = dirty;
    this._prettierPath = options.prettierPath ?? null;
    this._uncheckedKeys = new Set(Object.keys(this._snapshotData.grouped));
    this._counters = new Map();
    this._index = 0;
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
    this._uncheckedKeys.forEach(uncheckedKey => {
      if (keyToTestName(uncheckedKey) === testName) {
        this._uncheckedKeys.delete(uncheckedKey);
      }
    });
  }

  private _addSnapshot(
    key: string,
    receivedSerialized: string,
    kind: SnapshotKind,
    error: Error | undefined,
  ): void {
    this._dirty = true;
    if (kind.kind === 'inline') {
      error ||= new Error();
      const lines = getStackTraceLines(
        removeLinesBeforeExternalMatcherTrap(error.stack || ''),
      );
      const frame = getTopFrame(lines);
      if (!frame) {
        throw new Error(
          "Jest: Couldn't infer stack frame for inline snapshot.",
        );
      }
      this._snapshotData.inline.push({
        frame,
        snapshot: receivedSerialized,
      });
    } else {
      this._snapshotData.grouped[key] = receivedSerialized;
    }
  }

  clear(): void {
    this._snapshotData = {...this._initialData, inline: []};
    this._counters = new Map();
    this._index = 0;
    this.added = 0;
    this.matched = 0;
    this.unmatched = 0;
    this.updated = 0;
  }

  save(): SaveStatus {
    const hasExternalSnapshots = Object.keys(this._snapshotData.grouped).length;
    const hasInlineSnapshots = this._snapshotData.inline.length;
    const isEmpty = !hasExternalSnapshots && !hasInlineSnapshots;

    const status: SaveStatus = {
      deleted: false,
      saved: false,
    };

    if ((this._dirty || this._uncheckedKeys.size) && !isEmpty) {
      if (hasExternalSnapshots) {
        saveSnapshotFile(this._snapshotData, this._snapshotPath);
      }
      if (hasInlineSnapshots) {
        saveInlineSnapshots(
          this._snapshotData.inline,
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
    return Array.from(this._uncheckedKeys);
  }

  removeUncheckedKeys(): void {
    if (this._updateSnapshot === 'all' && this._uncheckedKeys.size) {
      this._dirty = true;
      this._uncheckedKeys.forEach(
        key => delete this._snapshotData.grouped[key],
      );
      this._uncheckedKeys.clear();
    }
  }

  match({
    testName,
    received,
    key,
    kind,
    error,
  }: SnapshotMatchOptions): SnapshotReturnOptions {
    this._counters.set(testName, (this._counters.get(testName) || 0) + 1);
    const count = Number(this._counters.get(testName));

    if (!key) {
      key = testNameToKey(testName, count);
    }

    // Do not mark the snapshot as "checked" if the snapshot is inline and
    // there's an external snapshot. This way the external snapshot can be
    // removed with `--updateSnapshot`.
    if (
      kind.kind === 'grouped' ||
      this._snapshotData.grouped[key] === undefined
    ) {
      this._uncheckedKeys.delete(key);
    }

    const receivedSerialized = addExtraLineBreaks(
      serialize(received, undefined, this.snapshotFormat),
    );
    const expected =
      kind.kind === 'inline' ? kind.value : this._snapshotData.grouped[key];
    const pass = expected === receivedSerialized;
    const hasSnapshot = expected !== undefined;
    const snapshotIsPersisted =
      kind.kind === 'inline' || fs.existsSync(this._snapshotPath);

    if (pass && kind.kind === 'grouped') {
      // Executing a snapshot file as JavaScript and writing the strings back
      // when other snapshots have changed loses the proper escaping for some
      // characters. Since we check every snapshot in every test, use the newly
      // generated formatted string.
      // Note that this is only relevant when a snapshot is added and the dirty
      // flag is set.
      this._snapshotData.grouped[key] = receivedSerialized;
    }

    // These are the conditions on when to write snapshots:
    //  * There's no snapshot file in a non-CI environment.
    //  * There is a snapshot file and we decided to update the snapshot.
    //  * There is a snapshot file, but it doesn't have this snaphsot.
    // These are the conditions on when not to write snapshots:
    //  * The update flag is set to 'none'.
    //  * There's no snapshot file or a file without this snapshot on a CI environment.
    if (
      (hasSnapshot && this._updateSnapshot === 'all') ||
      ((!hasSnapshot || !snapshotIsPersisted) &&
        (this._updateSnapshot === 'new' || this._updateSnapshot === 'all'))
    ) {
      if (this._updateSnapshot === 'all') {
        if (!pass) {
          if (hasSnapshot) {
            this.updated++;
          } else {
            this.added++;
          }
          this._addSnapshot(key, receivedSerialized, kind, error);
        } else {
          this.matched++;
        }
      } else {
        this._addSnapshot(key, receivedSerialized, kind, error);
        this.added++;
      }

      return {
        actual: '',
        count,
        expected: '',
        key,
        pass: true,
      };
    } else {
      if (!pass) {
        this.unmatched++;
        return {
          actual: removeExtraLineBreaks(receivedSerialized),
          count,
          expected:
            expected !== undefined
              ? removeExtraLineBreaks(expected)
              : undefined,
          key,
          pass: false,
        };
      } else {
        this.matched++;
        return {
          actual: '',
          count,
          expected: '',
          key,
          pass: true,
        };
      }
    }
  }

  fail(testName: string, _received: unknown, key?: string): string {
    this._counters.set(testName, (this._counters.get(testName) || 0) + 1);
    const count = Number(this._counters.get(testName));

    if (!key) {
      key = testNameToKey(testName, count);
    }

    this._uncheckedKeys.delete(key);
    this.unmatched++;
    return key;
  }
}
