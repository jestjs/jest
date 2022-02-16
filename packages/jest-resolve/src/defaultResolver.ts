/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isAbsolute} from 'path';
import pnpResolver from 'jest-pnp-resolver';
import {sync as resolveSync} from 'resolve';
import {
  Options as ResolveExportsOptions,
  resolve as resolveExports,
} from 'resolve.exports';
import slash = require('slash');
import {
  PkgJson,
  isDirectory,
  isFile,
  readPackageCached,
  realpathSync,
} from './fileWalkers';

// copy from `resolve`'s types so we don't have their types in our definition
// files
interface ResolverOptions {
  basedir: string;
  browser?: boolean;
  conditions?: Array<string>;
  defaultResolver: typeof defaultResolver;
  extensions?: Array<string>;
  moduleDirectory?: Array<string>;
  paths?: Array<string>;
  rootDir?: string;
  packageFilter?: (pkg: PkgJson, dir: string) => PkgJson;
  pathFilter?: (pkg: PkgJson, path: string, relativePath: string) => string;
}

// https://github.com/facebook/jest/pull/10617
declare global {
  namespace NodeJS {
    export interface ProcessVersions {
      pnp?: any;
    }
  }
}

export default function defaultResolver(
  path: string,
  options: ResolverOptions,
): string {
  // Yarn 2 adds support to `resolve` automatically so the pnpResolver is only
  // needed for Yarn 1 which implements version 1 of the pnp spec
  if (process.versions.pnp === '1') {
    return pnpResolver(path, options);
  }

  const result = resolveSync(path, {
    ...options,
    isDirectory,
    isFile,
    packageFilter: createPackageFilter(path, options.packageFilter),
    pathFilter: createPathFilter(path, options.conditions, options.pathFilter),
    preserveSymlinks: false,
    readPackageSync,
    realpathSync,
  });

  // Dereference symlinks to ensure we don't create a separate
  // module instance depending on how it was referenced.
  return realpathSync(result);
}

/*
 * helper functions
 */

function readPackageSync(_: unknown, file: string): PkgJson {
  return readPackageCached(file);
}

function createPackageFilter(
  originalPath: string,
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
  originalPath: string,
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
const shouldIgnoreRequestForExports = (path: string) =>
  path.startsWith('.') || isAbsolute(path);
