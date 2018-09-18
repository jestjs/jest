/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Glob, Path} from 'types/Config';
import type {FileData, LinkData} from 'types/HasteMap';

import * as fastPath from './lib/fast_path';
import fs from 'fs';
import micromatch from 'micromatch';
import H from './constants';

export default class HasteFS {
  _rootDir: Path;
  _files: FileData;
  _links: LinkData;

  constructor({
    rootDir,
    files,
    links,
  }: {
    rootDir: Path,
    files: FileData,
    links: LinkData,
  }) {
    this._rootDir = rootDir;
    this._files = files;
    this._links = links;
  }

  getModuleName(file: Path): ?string {
    const fileMetadata = this._getFileData(file);
    return (fileMetadata && fileMetadata[H.ID]) || null;
  }

  getDependencies(file: Path): ?Array<string> {
    const fileMetadata = this._getFileData(file);
    return (fileMetadata && fileMetadata[H.DEPENDENCIES]) || null;
  }

  getSha1(file: Path): ?string {
    const fileMetadata = this._getFileData(file);
    return (fileMetadata && fileMetadata[H.SHA1]) || null;
  }

  exists(file: Path): boolean {
    return this._getFileData(file) != null;
  }

  follow(file: Path): Path {
    const link = this._links[file];
    return link ? link[0] || (link[0] = fs.realpathSync(file)) : file;
  }

  getAllFiles(): Array<string> {
    return Array.from(this.getFileIterator());
  }

  *getFileIterator(): Iterator<string> {
    for (const file of this._files.keys()) {
      yield fastPath.resolve(this._rootDir, file);
    }
  }

  matchFiles(pattern: RegExp | string): Array<Path> {
    if (!(pattern instanceof RegExp)) {
      pattern = new RegExp(pattern);
    }
    const files = [];
    for (const file of this.getFileIterator()) {
      if (pattern.test(file)) {
        files.push(file);
      }
    }
    return files;
  }

  matchFilesWithGlob(globs: Array<Glob>, root: ?Path): Set<Path> {
    const files = new Set();
    for (const file of this.getFileIterator()) {
      const filePath = root ? fastPath.relative(root, file) : file;
      if (micromatch([filePath], globs).length) {
        files.add(file);
      }
    }
    return files;
  }

  _getFileData(file: Path) {
    const relativePath = fastPath.relative(this._rootDir, file);
    return this._files.get(relativePath);
  }
}
