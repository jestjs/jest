/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isAbsolute} from 'path';
import pnpResolver from 'jest-pnp-resolver';
import resolveAsync = require('resolve');
import {
  Options as ResolveExportsOptions,
  resolve as resolveExports,
} from 'resolve.exports';
import slash = require('slash');
import type {Config} from '@jest/types';
import {
  PkgJson,
  isDirectoryAsync,
  isDirectorySync,
  isFileAsync,
  isFileSync,
  readPackageCached,
  realpathAsync,
  realpathSync,
} from './fileWalkers';

const resolveSync = resolveAsync.sync;

// copy from `resolve`'s types so we don't have their types in our definition
// files
export interface ResolverOptions {
  basedir: Config.Path;
  browser?: boolean;
  conditions?: Array<string>;
  defaultResolver: typeof defaultResolver;
  extensions?: Array<string>;
  moduleDirectory?: Array<string>;
  paths?: Array<Config.Path>;
  rootDir?: Config.Path;
  packageFilter?: (pkg: PkgJson, dir: string) => PkgJson;
  pathFilter?: (pkg: PkgJson, path: string, relativePath: string) => string;
}

type ResolverOptionsAsync = Omit<ResolverOptions, 'defaultResolver'> & {
  defaultResolver: typeof defaultResolverAsync;
};

// https://github.com/facebook/jest/pull/10617
declare global {
  namespace NodeJS {
    export interface ProcessVersions {
      pnp?: any;
    }
  }
}

export function defaultResolver(
  path: Config.Path,
  options: ResolverOptions,
): Config.Path {
  // Yarn 2 adds support to `resolve` automatically so the pnpResolver is only
  // needed for Yarn 1 which implements version 1 of the pnp spec
  if (process.versions.pnp === '1') {
    return pnpResolver(path, options);
  }

  const result = resolveSync(path, getSyncResolveOptions(path, options));

  // Dereference symlinks to ensure we don't create a separate
  // module instance depending on how it was referenced.
  return realpathSync(result);
}

export async function defaultResolverAsync(
  path: Config.Path,
  options: ResolverOptionsAsync,
): Promise<Config.Path> {
  // Yarn 2 adds support to `resolve` automatically so the pnpResolver is only
  // needed for Yarn 1 which implements version 1 of the pnp spec
  if (process.versions.pnp === '1') {
    // @ts-expect-error until https://github.com/arcanis/jest-pnp-resolver/pull/10 is released
    return pnpResolver(path, options);
  }

  return new Promise((resolve, reject) => {
    function resolveCb(err: Error | null, result?: string) {
      if (err) {
        reject(err);
      }
      if (result) {
        resolve(realpathSync(result));
      }
    }
    const opts = getAsyncResolveOptions(path, options);
    resolveAsync(path, opts, resolveCb);
  });
}

/**
 * getSyncResolveOptions returns resolution options that are used synchronously.
 */
function getSyncResolveOptions(
  path: Config.Path,
  options: ResolverOptions,
): resolveAsync.SyncOpts {
  return {
    ...options,
    isDirectory: isDirectorySync,
    isFile: isFileSync,
    packageFilter: createPackageFilter(path, options.packageFilter),
    pathFilter: createPathFilter(path, options.conditions, options.pathFilter),
    preserveSymlinks: false,
    readPackageSync,
    realpathSync,
  };
}

/**
 * getAsyncResolveOptions returns resolution options that are used asynchronously.
 */
function getAsyncResolveOptions(
  path: Config.Path,
  options: ResolverOptionsAsync,
): resolveAsync.AsyncOpts {
  return {
    ...options,
    isDirectory: isDirectoryAsync,
    isFile: isFileAsync,
    packageFilter: createPackageFilter(path, options.packageFilter),
    pathFilter: createPathFilter(path, options.conditions, options.pathFilter),
    preserveSymlinks: false,
    readPackage: readPackageAsync,
    realpath: realpathAsync,
  };
}

/*
 * helper functions
 */

function readPackageSync(_: unknown, file: Config.Path): PkgJson {
  return readPackageCached(file);
}

function readPackageAsync(
  _: unknown,
  pkgfile: Config.Path,
  cb: (err: Error | null, pkgJson?: PkgJson) => void,
): void {
  try {
    // TODO: create an async version of readPackageCached
    const pkgJson = readPackageCached(pkgfile);
    cb(null, pkgJson);
  } catch (err: any) {
    cb(err);
  }
}

function createPackageFilter(
  originalPath: Config.Path,
  userFilter?: ResolverOptions['packageFilter'],
): ResolverOptions['packageFilter'] {
  if (shouldIgnoreRequestForExports(originalPath)) {
    return userFilter;
  }

  return function packageFilter(pkg, ...rest) {
    let filteredPkg = pkg;

    if (userFilter) {
      filteredPkg = userFilter(filteredPkg, ...rest);
    }

    if (filteredPkg.exports == null) {
      return filteredPkg;
    }

    return {
      ...filteredPkg,
      // remove `main` so `resolve` doesn't look at it and confuse the `.`
      // loading in `pathFilter`
      main: undefined,
    };
  };
}

function createPathFilter(
  originalPath: Config.Path,
  conditions?: Array<string>,
  userFilter?: ResolverOptions['pathFilter'],
): ResolverOptions['pathFilter'] {
  if (shouldIgnoreRequestForExports(originalPath)) {
    return userFilter;
  }

  const options: ResolveExportsOptions = conditions
    ? {conditions, unsafe: true}
    : // no conditions were passed - let's assume this is Jest internal and it should be `require`
      {browser: false, require: true};

  return function pathFilter(pkg, path, relativePath, ...rest) {
    let pathToUse = relativePath;

    if (userFilter) {
      pathToUse = userFilter(pkg, path, relativePath, ...rest);
    }

    if (pkg.exports == null) {
      return pathToUse;
    }

    // this `index` thing can backfire, but `resolve` adds it: https://github.com/browserify/resolve/blob/f1b51848ecb7f56f77bfb823511d032489a13eab/lib/sync.js#L192
    const isRootRequire =
      pathToUse === 'index' && !originalPath.endsWith('/index');

    const newPath = isRootRequire ? '.' : slash(pathToUse);

    return resolveExports(pkg, newPath, options) || pathToUse;
  };
}

// if it's a relative import or an absolute path, exports are ignored
const shouldIgnoreRequestForExports = (path: Config.Path) =>
  path.startsWith('.') || isAbsolute(path);
