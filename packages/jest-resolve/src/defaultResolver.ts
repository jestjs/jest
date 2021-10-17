/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import pnpResolver from 'jest-pnp-resolver';
import {Opts as ResolveOpts, sync as resolveSync} from 'resolve';
import {
  Options as ResolveExportsOptions,
  resolve as resolveExports,
} from 'resolve.exports';
import type {Config} from '@jest/types';
import {
  PkgJson,
  isDirectory,
  isFile,
  readPackageCached,
  realpathSync,
} from './fileWalkers';

interface ResolverOptions extends ResolveOpts {
  basedir: Config.Path;
  browser?: boolean;
  conditions?: Array<string>;
  defaultResolver: typeof defaultResolver;
  extensions?: Array<string>;
  rootDir?: Config.Path;
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
  path: Config.Path,
  options: ResolverOptions,
): Config.Path {
  // Yarn 2 adds support to `resolve` automatically so the pnpResolver is only
  // needed for Yarn 1 which implements version 1 of the pnp spec
  if (process.versions.pnp === '1') {
    return pnpResolver(path, options);
  }

  const result = resolveSync(path, {
    ...options,
    isDirectory,
    isFile,
    packageFilter: createPackageFilter(
      options.conditions,
      options.packageFilter,
    ),
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

function readPackageSync(_: unknown, file: Config.Path): PkgJson {
  return readPackageCached(file);
}

function createPackageFilter(
  conditions?: Array<string>,
  userFilter?: ResolverOptions['packageFilter'],
): ResolverOptions['packageFilter'] {
  function attemptExportsFallback(pkg: PkgJson) {
    const options: ResolveExportsOptions = conditions
      ? {conditions, unsafe: true}
      : // no conditions were passed - let's assume this is Jest internal and it should be `require`
        {browser: false, require: true};

    try {
      return resolveExports(pkg, '.', options);
    } catch {
      return undefined;
    }
  }

  return function packageFilter(pkg: PkgJson, path) {
    let filteredPkg = pkg;

    if (userFilter) {
      filteredPkg = userFilter(filteredPkg, path);
    }

    if (filteredPkg.main) {
      return filteredPkg;
    }

    const indexInRoot = resolve(path, './index.js');

    // if the module contains an `index.js` file in root, `resolve` will request
    // that if there is no `main`. Since we don't wanna break that, add this
    // check
    if (isFile(indexInRoot)) {
      return filteredPkg;
    }

    return {
      ...filteredPkg,
      main: filteredPkg.main ?? attemptExportsFallback(filteredPkg),
    };
  };
}
