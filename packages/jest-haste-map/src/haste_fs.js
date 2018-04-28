/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Glob, Path} from 'types/Config';
import type {FileData} from 'types/HasteMap';

import path from 'path';
import micromatch from 'micromatch';
import H from './constants';

export default class HasteFS {
  _files: FileData;

  constructor(files: FileData) {
    this._files = files;
  }

  getModuleName(file: Path): ?string {
    return (this._files[file] && this._files[file][H.ID]) || null;
  }

  getDependencies(file: Path): ?Array<string> {
    return (this._files[file] && this._files[file][H.DEPENDENCIES]) || null;
  }

  getSha1(file: Path): ?string {
    return (this._files[file] && this._files[file][H.SHA1]) || null;
  }

  exists(file: Path): boolean {
    return !!this._files[file];
  }

  getAllFiles(): Array<string> {
    return Object.keys(this._files);
  }

  matchFiles(pattern: RegExp | string): Array<Path> {
    if (!(pattern instanceof RegExp)) {
      pattern = new RegExp(pattern);
    }
    const files = [];
    for (const file in this._files) {
      if (pattern.test(file)) {
        files.push(file);
      }
    }
    return files;
  }

  matchFilesWithGlob(globs: Array<Glob>, root: ?Path): Set<Path> {
    const files = new Set();
    for (const file in this._files) {
      const filePath = root ? path.relative(root, file) : file;
      if (micromatch([filePath], globs).length) {
        files.add(file);
      }
    }
    return files;
  }
}
