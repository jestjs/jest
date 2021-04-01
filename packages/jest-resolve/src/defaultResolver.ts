/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import pnpResolver from 'jest-pnp-resolver';
import {sync as resolveSync} from 'resolve';
import type {Config} from '@jest/types';
import {tryRealpath} from 'jest-util';

type ResolverOptions = {
  basedir: Config.Path;
  browser?: boolean;
  defaultResolver: typeof defaultResolver;
  extensions?: Array<string>;
  moduleDirectory?: Array<string>;
  paths?: Array<Config.Path>;
  rootDir?: Config.Path;
  packageFilter?: (pkg: any, pkgfile: string) => any;
};

// https://github.com/facebook/jest/pull/10617
declare global {
  namespace NodeJS {
    export interface ProcessVersions {
      pnp?: any;
    }
  }
}

export default function defaultResolver(
  path: Config.Path,
  options: ResolverOptions,
): Config.Path {
  // Yarn 2 adds support to `resolve` automatically so the pnpResolver is only
  // needed for Yarn 1 which implements version 1 of the pnp spec
  if (process.versions.pnp === '1') {
    return pnpResolver(path, options);
  }

  const result = resolveSync(path, {
    basedir: options.basedir,
    extensions: options.extensions,
    isDirectory,
    isFile,
    moduleDirectory: options.moduleDirectory,
    packageFilter: options.packageFilter,
    paths: options.paths,
    preserveSymlinks: false,
    readPackageSync,
    realpathSync,
  });

  // Dereference symlinks to ensure we don't create a separate
  // module instance depending on how it was referenced.
  return realpathSync(result);
}

export function clearDefaultResolverCache(): void {
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

const checkedRealpathPaths = new Map<string, string>();
function realpathCached(path: Config.Path): Config.Path {
  let result = checkedRealpathPaths.get(path);

  if (result !== undefined) {
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

type PkgJson = Record<string, unknown>;

const packageContents = new Map<string, PkgJson>();
function readPackageCached(path: Config.Path): PkgJson {
  let result = packageContents.get(path);

  if (result !== undefined) {
    return result;
  }

  result = JSON.parse(fs.readFileSync(path, 'utf8')) as PkgJson;

  packageContents.set(path, result);

  return result;
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

function realpathSync(file: Config.Path): Config.Path {
  return realpathCached(file);
}

function readPackageSync(_: unknown, file: Config.Path): PkgJson {
  return readPackageCached(file);
}
