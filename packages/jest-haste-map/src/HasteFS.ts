/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {globsToMatcher, replacePathSepForGlob} from 'jest-util';
import H from './constants';
import * as fastPath from './lib/fast_path';
import type {FileData, IHasteFS} from './types';

export default class HasteFS implements IHasteFS {
  private readonly _rootDir: string;
  private readonly _files: FileData;

  constructor({rootDir, files}: {rootDir: string; files: FileData}) {
    this._rootDir = rootDir;
    this._files = files;
  }

  getModuleName(file: string): string | null {
    const fileMetadata = this._getFileData(file);
    return (fileMetadata && fileMetadata[H.ID]) || null;
  }

  getSize(file: string): number | null {
    const fileMetadata = this._getFileData(file);
    return (fileMetadata && fileMetadata[H.SIZE]) || null;
  }

  getDependencies(file: string): Array<string> | null {
    const fileMetadata = this._getFileData(file);

    if (fileMetadata) {
      return fileMetadata[H.DEPENDENCIES]
        ? fileMetadata[H.DEPENDENCIES].split(H.DEPENDENCY_DELIM)
        : [];
    } else {
      return null;
    }
  }

  getSha1(file: string): string | null {
    const fileMetadata = this._getFileData(file);
    return (fileMetadata && fileMetadata[H.SHA1]) || null;
  }

  exists(file: string): boolean {
    return this._getFileData(file) != null;
  }

  getAllFiles(): Array<string> {
    return Array.from(this.getAbsoluteFileIterator());
  }

  getFileIterator(): Iterable<string> {
    return this._files.keys();
  }

  *getAbsoluteFileIterator(): Iterable<string> {
    for (const file of this.getFileIterator()) {
      yield fastPath.resolve(this._rootDir, file);
    }
  }

  matchFiles(pattern: RegExp | string): Array<string> {
    if (!(pattern instanceof RegExp)) {
      pattern = new RegExp(pattern);
    }
    const files = [];
    for (const file of this.getAbsoluteFileIterator()) {
      if (pattern.test(file)) {
        files.push(file);
      }
    }
    return files;
  }

  matchFilesWithGlob(globs: Array<string>, root: string | null): Set<string> {
    const files = new Set<string>();
    const matcher = globsToMatcher(globs);

    for (const file of this.getAbsoluteFileIterator()) {
      const filePath = root ? fastPath.relative(root, file) : file;
      if (matcher(replacePathSepForGlob(filePath))) {
        files.add(file);
      }
    }
    return files;
  }

  private _getFileData(file: string) {
    const relativePath = fastPath.relative(this._rootDir, file);
    return this._files.get(relativePath);
  }
}
