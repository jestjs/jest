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
const fileExists = require('jest-file-exists');
const fs = require('fs');
const jsxLikeExtension = require('pretty-format/plugins/ReactTestComponent');
const path = require('path');
const prettyFormat = require('pretty-format');

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

const escape = string => string.replace(/\`/g, '\\\`');
const unescape = string => string.replace(/\\(\"|\\|\')/g, '$1');

// Extra line breaks at the beginning and at the end of the snapshot are useful
// to make the content of the snapshot easier to read
const addExtraLineBreaks =
  string => string.includes('\n') ? `\n${string}\n` : string;

class SnapshotFile {

  _content: SnapshotData;
  _dirty: boolean;
  _filename: Path;
  _uncheckedKeys: Set<string>;

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
    return addExtraLineBreaks(prettyFormat(data, {
      plugins: [jsxLikeExtension],
    }));
  }

  save(update: boolean): SaveStatus {
    const status = {
      deleted: false,
      saved: false,
    };

    const isEmpty = Object.keys(this._content).length === 0;
    if ((this._dirty || this._uncheckedKeys.size) && !isEmpty) {
      const snapshots = Object.keys(this._content).sort().map(key =>
        'exports[`' + escape(key) + '`] = `' +
        escape(this._content[key]) + '`;',
      );

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
    const serialized = this.serialize(value);
    const actual = unescape(serialized);
    const expected = this.get(key);
    const pass = expected === actual;
    if (pass) {
      // Executing a snapshot file as JavaScript and writing the strings back
      // when other snapshots have changed loses the proper escaping for some
      // characters. Since we check every snapshot in every test, use the newly
      // generated formatted string.
      // Note that this is only relevant when a snapshot is added and the dirty
      // flag is set.
      this._content[key] = serialized;
    }
    return {
      actual,
      expected,
      pass,
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
      path.basename(testPath) + '.' + SNAPSHOT_EXTENSION,
    );

    return new SnapshotFile(snapshotFilename);
  },
};
