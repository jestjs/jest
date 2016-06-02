/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const createDirectory = require('jest-util').createDirectory;
const fs = require('fs');
const path = require('path');
const prettyFormat = require('pretty-format');

const SNAPSHOT_EXTENSION = '.snap';

const ensureDirectoryExists = filePath => {
  try {
    createDirectory(path.join(path.dirname(filePath)));
  } catch (e) {}
};

const escape = string => string.replace(/\`/g, '\\`');

const fileExists = filePath => {
  try {
    return fs.statSync(filePath).isFile();
  } catch (e) {}
  return false;
};

class SnapshotFile {

  constructor(filename) {
    this._filename = filename;
    this._dirty = false;

    this._content = Object.create(null);
    if (this.fileExists(filename)) {
      try {
        Object.assign(this._content, require(filename));
      } catch (e) {}
    }
    this._uncheckedKeys = new Set(Object.keys(this._content));
  }

  fileExists() {
    return fileExists(this._filename);
  }

  serialize(data) {
    return prettyFormat(data);
  }

  save() {
    const operationResult = {
      deleted: false,
      saved: false,
    };

    this._uncheckedKeys.forEach(key => delete this._content[key]);
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
      operationResult.saved = true;
    }

    if (isEmpty && this.fileExists()) {
      fs.unlinkSync(this._filename);
      operationResult.deleted = true;
    }

    return operationResult;
  }

  has(key) {
    return this._content[key] !== undefined;
  }

  get(key) {
    return this._content[key];
  }

  matches(key, value) {
    this._uncheckedKeys.delete(key);
    const actual = this.serialize(value);
    const expected = this.get(key);
    return {
      actual,
      expected,
      pass: expected === actual,
    };
  }

  add(key, value) {
    this._dirty = true;
    this._uncheckedKeys.delete(key);
    this._content[key] = this.serialize(value);
  }

}

module.exports = {
  forFile(testPath) {
    const snapshotsPath = path.join(path.dirname(testPath), '__snapshots__');

    const snapshotFilename = path.join(
      snapshotsPath,
      path.basename(testPath) + SNAPSHOT_EXTENSION
    );

    return new SnapshotFile(snapshotFilename);
  },
};
