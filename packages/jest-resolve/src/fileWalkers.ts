/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {dirname, resolve} from 'path';
import * as fs from 'graceful-fs';
import {tryRealpath} from 'jest-util';
import type {PackageJSON} from './types';

export function clearFsCache(): void {
  checkedPaths.clear();
  checkedRealpathPaths.clear();
  packageContents.clear();
}

enum IPathType {
  FILE = 1,
  DIRECTORY = 2,
  OTHER = 3,
}
const checkedPaths = new Map<string, IPathType>();
function statSyncCached(path: string): IPathType {
  const result = checkedPaths.get(path);
  if (result != null) {
    return result;
  }

  let stat;
  try {
    // @ts-expect-error TS2554 - throwIfNoEntry is only available in recent version of node, but inclusion of the option is a backward compatible no-op.
    stat = fs.statSync(path, {throwIfNoEntry: false});
  } catch (e: any) {
    if (!(e && (e.code === 'ENOENT' || e.code === 'ENOTDIR'))) {
      throw e;
    }
  }

  if (stat) {
    if (stat.isFile() || stat.isFIFO()) {
      checkedPaths.set(path, IPathType.FILE);
      return IPathType.FILE;
    } else if (stat.isDirectory()) {
      checkedPaths.set(path, IPathType.DIRECTORY);
      return IPathType.DIRECTORY;
    }
  }

  checkedPaths.set(path, IPathType.OTHER);
  return IPathType.OTHER;
}

const checkedRealpathPaths = new Map<string, string>();
function realpathCached(path: string): string {
  let result = checkedRealpathPaths.get(path);

  if (result != null) {
    return result;
  }

  result = tryRealpath(path);

  checkedRealpathPaths.set(path, result);

  if (path !== result) {
    // also cache the result in case it's ever referenced directly - no reason to `realpath` that as well
    checkedRealpathPaths.set(result, result);
  }

  return result;
}

const packageContents = new Map<string, PackageJSON>();
export function readPackageCached(path: string): PackageJSON {
  let result = packageContents.get(path);

  if (result != null) {
    return result;
  }

  result = JSON.parse(fs.readFileSync(path, 'utf8')) as PackageJSON;

  packageContents.set(path, result);

  return result;
}

// adapted from
// https://github.com/lukeed/escalade/blob/2477005062cdbd8407afc90d3f48f4930354252b/src/sync.js
// to use cached `fs` calls
export function findClosestPackageJson(start: string): string | undefined {
  let dir = resolve('.', start);
  if (!isDirectory(dir)) {
    dir = dirname(dir);
  }

  while (true) {
    const pkgJsonFile = resolve(dir, './package.json');
    const hasPackageJson = isFile(pkgJsonFile);

    if (hasPackageJson) {
      return pkgJsonFile;
    }

    const prevDir = dir;
    dir = dirname(dir);

    if (prevDir === dir) {
      return undefined;
    }
  }
}

/*
 * helper functions
 */
export function isFile(file: string): boolean {
  return statSyncCached(file) === IPathType.FILE;
}

export function isDirectory(dir: string): boolean {
  return statSyncCached(dir) === IPathType.DIRECTORY;
}

export function realpathSync(file: string): string {
  return realpathCached(file);
}
