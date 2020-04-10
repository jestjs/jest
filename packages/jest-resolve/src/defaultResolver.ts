/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs';
import {sync as resolveSync} from 'resolve';
import {sync as browserResolve} from 'browser-resolve';
import {sync as realpath} from 'realpath-native';
import pnpResolver from 'jest-pnp-resolver';
import type {Config} from '@jest/types';

type ResolverOptions = {
  basedir: Config.Path;
  browser?: boolean;
  defaultResolver: typeof defaultResolver;
  extensions?: Array<string>;
  moduleDirectory?: Array<string>;
  paths?: Array<Config.Path>;
  rootDir?: Config.Path;
};

export default function defaultResolver(
  path: Config.Path,
  options: ResolverOptions,
): Config.Path {
  // @ts-ignore: the "pnp" version named isn't in DefinitelyTyped
  if (process.versions.pnp) {
    return pnpResolver(path, options);
  }

  const resolve = options.browser ? browserResolve : resolveSync;

  const result = resolve(path, {
    basedir: options.basedir,
    extensions: options.extensions,
    isDirectory,
    isFile,
    moduleDirectory: options.moduleDirectory,
    paths: options.paths,
    preserveSymlinks: false,
  });

  try {
    // Dereference symlinks to ensure we don't create a separate
    // module instance depending on how it was referenced.
    const resolved = realpath(result);

    if (resolved) {
      return resolved;
    }
  } catch {
    // ignore
  }

  return result;
}

export function clearDefaultResolverCache(): void {
  checkedPaths.clear();
}

enum IPathType {
  FILE = 1,
  DIRECTORY = 2,
  OTHER = 3,
}
const checkedPaths = new Map<string, IPathType>();
function statSyncCached(path: string): IPathType {
  const result = checkedPaths.get(path);
  if (result !== undefined) {
    return result;
  }

  let stat;
  try {
    stat = fs.statSync(path);
  } catch (e) {
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

/*
 * helper functions
 */
function isFile(file: Config.Path): boolean {
  return statSyncCached(file) === IPathType.FILE;
}

function isDirectory(dir: Config.Path): boolean {
  return statSyncCached(dir) === IPathType.DIRECTORY;
}
