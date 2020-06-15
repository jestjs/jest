/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import micromatch = require('micromatch');
import {replacePathSepForGlob} from 'jest-util';
import type {Config} from '@jest/types';
import type {FileData} from './types';
import * as fastPath from './lib/fast_path';
import H from './constants';

export default class HasteFS {
  private readonly _rootDir: Config.Path;
  private readonly _files: FileData;

  constructor({rootDir, files}: {rootDir: Config.Path; files: FileData}) {
    this._rootDir = rootDir;
    this._files = files;
  }

  getModuleName(file: Config.Path): string | null {
    const fileMetadata = this._getFileData(file);
    return (fileMetadata && fileMetadata[H.ID]) || null;
  }

  getSize(file: Config.Path): number | null {
    const fileMetadata = this._getFileData(file);
    return (fileMetadata && fileMetadata[H.SIZE]) || null;
  }

  getDependencies(file: Config.Path): Array<string> | null {
    const fileMetadata = this._getFileData(file);

    if (fileMetadata) {
      return fileMetadata[H.DEPENDENCIES]
        ? fileMetadata[H.DEPENDENCIES].split(H.DEPENDENCY_DELIM)
        : [];
    } else {
      return null;
    }
  }

  getSha1(file: Config.Path): string | null {
    const fileMetadata = this._getFileData(file);
    return (fileMetadata && fileMetadata[H.SHA1]) || null;
  }

  exists(file: Config.Path): boolean {
    return this._getFileData(file) != null;
  }

  getAllFiles(): Array<Config.Path> {
    return Array.from(this.getAbsoluteFileIterator());
  }

  getFileIterator(): Iterable<Config.Path> {
    return this._files.keys();
  }

  *getAbsoluteFileIterator(): Iterable<Config.Path> {
    for (const file of this.getFileIterator()) {
      yield fastPath.resolve(this._rootDir, file);
    }
  }

  matchFiles(pattern: RegExp | string): Array<Config.Path> {
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

  matchFilesWithGlob(
    globs: Array<Config.Glob>,
    root: Config.Path | null,
  ): Set<Config.Path> {
    const files = new Set<string>();
    for (const file of this.getAbsoluteFileIterator()) {
      const filePath = root ? fastPath.relative(root, file) : file;
      if (micromatch([replacePathSepForGlob(filePath)], globs).length > 0) {
        files.add(file);
      }
    }
    return files;
  }

  private _getFileData(file: Config.Path) {
    const relativePath = fastPath.relative(this._rootDir, file);
    return this._files.get(relativePath);
  }
}
