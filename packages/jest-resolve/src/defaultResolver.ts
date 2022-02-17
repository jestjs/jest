/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {dirname, isAbsolute, resolve as pathResolve} from 'path';
import pnpResolver from 'jest-pnp-resolver';
import {SyncOpts as UpstreamResolveOptions, sync as resolveSync} from 'resolve';
import {
  Options as ResolveExportsOptions,
  resolve as resolveExports,
} from 'resolve.exports';
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

type UpstreamResolveOptionsWithConditions = UpstreamResolveOptions &
  Pick<ResolverOptions, 'conditions'>;

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

  const resolveOptions: UpstreamResolveOptionsWithConditions = {
    ...options,
    isDirectory,
    isFile,
    preserveSymlinks: false,
    readPackageSync,
    realpathSync,
  };

  const pathToResolve = getPathInModule(path, resolveOptions);

  const result =
    // if `getPathInModule` doesn't change the path, attempt to resolve it
    pathToResolve === path
      ? resolveSync(pathToResolve, resolveOptions)
      : pathToResolve;

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

function getPathInModule(
  path: string,
  options: UpstreamResolveOptionsWithConditions,
): string {
  if (shouldIgnoreRequestForExports(path)) {
    return path;
  }

  const segments = path.split('/');

  let moduleName = segments.shift();

  if (moduleName) {
    // TODO: handle `#` here: https://github.com/facebook/jest/issues/12270
    if (moduleName.startsWith('@')) {
      moduleName = `${moduleName}/${segments.shift()}`;
    }

    let packageJsonPath = '';

    try {
      packageJsonPath = resolveSync(`${moduleName}/package.json`, options);
    } catch {
      // ignore if package.json cannot be found
    }

    if (packageJsonPath && isFile(packageJsonPath)) {
      const pkg = readPackageCached(packageJsonPath);

      if (pkg.exports) {
        // we need to make sure resolve ignores `main`
        delete pkg.main;

        const subpath = segments.join('/') || '.';

        const resolved = resolveExports(
          pkg,
          subpath,
          createResolveOptions(options.conditions),
        );

        // TODO: should we throw if not?
        if (resolved) {
          return pathResolve(dirname(packageJsonPath), resolved);
        }
      }
    }
  }

  return path;
}

function createResolveOptions(
  conditions: Array<string> | undefined,
): ResolveExportsOptions {
  return conditions
    ? {conditions, unsafe: true}
    : // no conditions were passed - let's assume this is Jest internal and it should be `require`
      {browser: false, require: true};
}

// if it's a relative import or an absolute path, exports are ignored
const shouldIgnoreRequestForExports = (path: string) =>
  path.startsWith('.') || isAbsolute(path);
