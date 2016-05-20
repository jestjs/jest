/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const createDirectory = require('jest-util').createDirectory;

const SNAPSHOT_EXTENSION = '.snap';
const ensureDirectoryExists = filePath => {
  try {
    createDirectory(path.join(path.dirname(filePath)));
  } catch (e) {}
};
const fileExists = filePath => {
  try {
    fs.accessSync(filePath, fs.R_OK);
    return true;
  } catch (e) {}
  return false;
};

class SnapshotFile {

  constructor(filename) {
    this._filename = filename;
    if (this.fileExists(filename)) {
      this._content = JSON.parse(fs.readFileSync(filename));
    } else {
      this._content = {};
    }

    return this._loaded;
  }

  fileExists() {
    return fileExists(this._filename);
  }

  save() {
    const serialized = JSON.stringify(this._content);
    if (serialized !== '{}') {
      ensureDirectoryExists(this._filename);
      fs.writeFileSync(this._filename, serialized);
    }
  }

  has(key) {
    return this._content[key] !== undefined;
  }

  get(key) {
    return this._content[key];
  }

  matches(key, value) {
    return this.get(key) === value;
  }

  add(key, value) {
    this._content[key] = value;
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
