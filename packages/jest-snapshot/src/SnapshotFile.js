/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const createDirectory = require('jest-util').createDirectory;
const fs = require('fs');
const path = require('path');
const prettyFormat = require('pretty-format');
const jsxLikeExtension = require('pretty-format/plugins/ReactTestComponent');
const SNAPSHOT_EXTENSION = 'snap';

import type {Path} from 'types/Config';

export type SnapshotFileT = SnapshotFile;

export type MatchResult = {
  actual: string,
  expected: string,
  pass: boolean,
};

type SnapshotData = {[key: string]: string};

type SaveStatus = {
  deleted: boolean,
  saved: boolean,
};

const ensureDirectoryExists = (filePath: Path) => {
  try {
    createDirectory(path.join(path.dirname(filePath)));
  } catch (e) {}
};

const escape = string => string.replace(/\`/g, '\\`');

const fileExists = (filePath: Path): boolean => {
  try {
    return fs.statSync(filePath).isFile();
  } catch (e) {}
  return false;
};

class SnapshotFile {

  _content: SnapshotData;
  _dirty: boolean;
  _filename: Path;
  _uncheckedKeys: Set;

  constructor(filename: Path): void {
    this._filename = filename;
    this._dirty = false;

    this._content = Object.create(null);
    if (this.fileExists(filename)) {
      try {
        /* eslint-disable no-useless-call */
        Object.assign(this._content, require.call(null, filename));
        /* eslint-enable no-useless-call */
      } catch (e) {}
    }
    this._uncheckedKeys = new Set(Object.keys(this._content));
  }

  hasUncheckedKeys(): boolean {
    return this._uncheckedKeys.size > 0;
  }

  fileExists(): boolean {
    return fileExists(this._filename);
  }

  removeUncheckedKeys(): void {
    if (this._uncheckedKeys.size) {
      this._dirty = true;
      this._uncheckedKeys.forEach(key => delete this._content[key]);
      this._uncheckedKeys.clear();
    }
  }

  serialize(data: any): string {
    return prettyFormat(data, {
      plugins: [jsxLikeExtension],
    });
  }

  save(update: boolean): SaveStatus {
    const status = {
      deleted: false,
      saved: false,
    };

    const isEmpty = Object.keys(this._content).length === 0;
    if ((this._dirty || this._uncheckedKeys.size) && !isEmpty) {
      const snapshots = [];
      for (const key in this._content) {
        const item = this._content[key];
        snapshots.push(
          'exports[`' + escape(key) + '`] = `' + escape(item) + '`;'
        );
      }

      ensureDirectoryExists(this._filename);
      fs.writeFileSync(this._filename, snapshots.join('\n\n') + '\n');
      status.saved = true;
    } else if (isEmpty && this.fileExists()) {
      if (update) {
        fs.unlinkSync(this._filename);
      }
      status.deleted = true;
    }

    return status;
  }

  has(key: string): boolean {
    return this._content[key] !== undefined;
  }

  get(key: string): any {
    return this._content[key];
  }

  matches(key: string, value: any): MatchResult {
    this._uncheckedKeys.delete(key);
    const actual = this.serialize(value);
    const expected = this.get(key);
    return {
      actual,
      expected,
      pass: expected === actual,
    };
  }

  add(key: string, value: any): void {
    this._dirty = true;
    this._uncheckedKeys.delete(key);
    this._content[key] = this.serialize(value);
  }

}

module.exports = {
  SNAPSHOT_EXTENSION,
  forFile(testPath: Path): SnapshotFile {
    const snapshotsPath = path.join(path.dirname(testPath), '__snapshots__');

    const snapshotFilename = path.join(
      snapshotsPath,
      path.basename(testPath) + '.' + SNAPSHOT_EXTENSION
    );

    return new SnapshotFile(snapshotFilename);
  },
};
