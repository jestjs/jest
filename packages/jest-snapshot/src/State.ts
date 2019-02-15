/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 */

import fs from 'fs';
import {Config} from '@jest/types';

import {getTopFrame, getStackTraceLines} from 'jest-message-util';
import {
  saveSnapshotFile,
  getSnapshotData,
  keyToTestName,
  serialize,
  testNameToKey,
  unescape,
} from './utils';
import {saveInlineSnapshots, InlineSnapshot} from './inline_snapshots';
import {SnapshotData} from './types';

export type SnapshotStateOptions = {
  updateSnapshot: Config.SnapshotUpdateState;
  getPrettier: () => null | any;
  getBabelTraverse: () => Function;
  expand?: boolean;
};

export type SnapshotMatchOptions = {
  testName: string;
  received: any;
  key?: string;
  inlineSnapshot?: string;
  error?: Error;
};

export default class SnapshotState {
  private counters: Map<string, number>;
  private dirty: boolean;
  private index: number;
  private updateSnapshot: Config.SnapshotUpdateState;
  private snapshotData: SnapshotData;
  private snapshotPath: Config.Path;
  private inlineSnapshots: Array<InlineSnapshot>;
  private uncheckedKeys: Set<string>;
  private getBabelTraverse: () => Function;
  private getPrettier: () => null | any;

  added: number;
  expand: boolean;
  matched: number;
  unmatched: number;
  updated: number;

  constructor(snapshotPath: Config.Path, options: SnapshotStateOptions) {
    this.snapshotPath = snapshotPath;
    const {data, dirty} = getSnapshotData(
      this.snapshotPath,
      options.updateSnapshot,
    );
    this.snapshotData = data;
    this.dirty = dirty;
    this.getBabelTraverse = options.getBabelTraverse;
    this.getPrettier = options.getPrettier;
    this.inlineSnapshots = [];
    this.uncheckedKeys = new Set(Object.keys(this.snapshotData));
    this.counters = new Map();
    this.index = 0;
    this.expand = options.expand || false;
    this.added = 0;
    this.matched = 0;
    this.unmatched = 0;
    this.updateSnapshot = options.updateSnapshot;
    this.updated = 0;
  }

  markSnapshotsAsCheckedForTest(testName: string) {
    this.uncheckedKeys.forEach(uncheckedKey => {
      if (keyToTestName(uncheckedKey) === testName) {
        this.uncheckedKeys.delete(uncheckedKey);
      }
    });
  }

  _addSnapshot(
    key: string,
    receivedSerialized: string,
    options: {isInline: boolean; error?: Error},
  ) {
    this.dirty = true;
    if (options.isInline) {
      const error = options.error || new Error();
      const lines = getStackTraceLines(error.stack || '');
      const frame = getTopFrame(lines);
      if (!frame) {
        throw new Error(
          "Jest: Couldn't infer stack frame for inline snapshot.",
        );
      }
      this.inlineSnapshots.push({
        frame: {
          column: frame.column,
          file: frame.file as string,
          line: frame.line,
        },
        snapshot: receivedSerialized,
      });
    } else {
      this.snapshotData[key] = receivedSerialized;
    }
  }

  save() {
    const hasExternalSnapshots = Object.keys(this.snapshotData).length;
    const hasInlineSnapshots = this.inlineSnapshots.length;
    const isEmpty = !hasExternalSnapshots && !hasInlineSnapshots;

    const status = {
      deleted: false,
      saved: false,
    };

    if ((this.dirty || this.uncheckedKeys.size) && !isEmpty) {
      if (hasExternalSnapshots) {
        saveSnapshotFile(this.snapshotData, this.snapshotPath);
      }
      if (hasInlineSnapshots) {
        const prettier = this.getPrettier(); // Load lazily
        const babelTraverse = this.getBabelTraverse(); // Load lazily
        saveInlineSnapshots(this.inlineSnapshots, prettier, babelTraverse);
      }
      status.saved = true;
    } else if (!hasExternalSnapshots && fs.existsSync(this.snapshotPath)) {
      if (this.updateSnapshot === 'all') {
        fs.unlinkSync(this.snapshotPath);
      }
      status.deleted = true;
    }

    return status;
  }

  getUncheckedCount(): number {
    return this.uncheckedKeys.size || 0;
  }

  getUncheckedKeys(): Array<string> {
    return Array.from(this.uncheckedKeys);
  }

  removeUncheckedKeys(): void {
    if (this.updateSnapshot === 'all' && this.uncheckedKeys.size) {
      this.dirty = true;
      this.uncheckedKeys.forEach(key => delete this.snapshotData[key]);
      this.uncheckedKeys.clear();
    }
  }

  match({
    testName,
    received,
    key,
    inlineSnapshot,
    error,
  }: SnapshotMatchOptions) {
    this.counters.set(testName, (this.counters.get(testName) || 0) + 1);
    const count = Number(this.counters.get(testName));
    const isInline = inlineSnapshot !== undefined;

    if (!key) {
      key = testNameToKey(testName, count);
    }

    // Do not mark the snapshot as "checked" if the snapshot is inline and
    // there's an external snapshot. This way the external snapshot can be
    // removed with `--updateSnapshot`.
    if (!(isInline && this.snapshotData[key])) {
      this.uncheckedKeys.delete(key);
    }

    const receivedSerialized = serialize(received);
    const expected = isInline ? inlineSnapshot : this.snapshotData[key];
    const pass = expected === receivedSerialized;
    const hasSnapshot = isInline
      ? inlineSnapshot !== ''
      : this.snapshotData[key] !== undefined;
    const snapshotIsPersisted = isInline || fs.existsSync(this.snapshotPath);

    if (pass && !isInline) {
      // Executing a snapshot file as JavaScript and writing the strings back
      // when other snapshots have changed loses the proper escaping for some
      // characters. Since we check every snapshot in every test, use the newly
      // generated formatted string.
      // Note that this is only relevant when a snapshot is added and the dirty
      // flag is set.
      this.snapshotData[key] = receivedSerialized;
    }

    // These are the conditions on when to write snapshots:
    //  * There's no snapshot file in a non-CI environment.
    //  * There is a snapshot file and we decided to update the snapshot.
    //  * There is a snapshot file, but it doesn't have this snaphsot.
    // These are the conditions on when not to write snapshots:
    //  * The update flag is set to 'none'.
    //  * There's no snapshot file or a file without this snapshot on a CI environment.
    if (
      (hasSnapshot && this.updateSnapshot === 'all') ||
      ((!hasSnapshot || !snapshotIsPersisted) &&
        (this.updateSnapshot === 'new' || this.updateSnapshot === 'all'))
    ) {
      if (this.updateSnapshot === 'all') {
        if (!pass) {
          if (hasSnapshot) {
            this.updated++;
          } else {
            this.added++;
          }
          this._addSnapshot(key, receivedSerialized, {error, isInline});
        } else {
          this.matched++;
        }
      } else {
        this._addSnapshot(key, receivedSerialized, {error, isInline});
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
          actual: unescape(receivedSerialized),
          count,
          expected: expected ? unescape(expected) : null,
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

  fail(testName: string, _: any, key?: string) {
    this.counters.set(testName, (this.counters.get(testName) || 0) + 1);
    const count = Number(this.counters.get(testName));

    if (!key) {
      key = testNameToKey(testName, count);
    }

    this.uncheckedKeys.delete(key);
    this.unmatched++;
    return key;
  }
}
