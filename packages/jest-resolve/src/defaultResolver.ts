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
  PackageJson,
  findClosestPackageJson,
  isDirectory,
  isFile,
  readPackageCached,
  realpathSync,
} from './fileWalkers';

type ResolverOptions = {
  /** Directory to begin resolving from. */
  basedir: string;
  /** List of export conditions. */
  conditions?: Array<string>;
  /** Instance of default resolver. */
  defaultResolver: typeof defaultResolver;
  /** List of file extensions to search in order. */
  extensions?: Array<string>;
  /**
   * List of directory names to be looked up for modules recursively.
   *
   * @defaultValue
   * The default is `['node_modules']`.
   */
  moduleDirectory?: Array<string>;
  /**
   * List of `require.paths` to use if nothing is found in `node_modules`.
   *
   * @defaultValue
   * The default is `undefined`.
   */
  paths?: Array<string>;
  /** Allows transforming parsed `package.json` contents. */
  packageFilter?: (pkg: PackageJson, file: string, dir: string) => PackageJson;
  /** Allows transforms a path within a package. */
  pathFilter?: (pkg: PackageJson, path: string, relativePath: string) => string;
  /** Current root directory. */
  rootDir?: string;
};

type UpstreamResolveOptionsWithConditions = UpstreamResolveOptions &
  Pick<ResolverOptions, 'basedir' | 'conditions'>;

export type SyncResolver = (path: string, options: ResolverOptions) => string;
export type AsyncResolver = (
  path: string,
  options: ResolverOptions,
) => Promise<string>;

export type Resolver = SyncResolver | AsyncResolver;

// https://github.com/facebook/jest/pull/10617
declare global {
  namespace NodeJS {
    export interface ProcessVersions {
      pnp?: any;
    }
  }
}

const defaultResolver: SyncResolver = (path, options) => {
  // Yarn 2 adds support to `resolve` automatically so the pnpResolver is only
  // needed for Yarn 1 which implements version 1 of the pnp spec
  if (process.versions.pnp === '1') {
    return pnpResolver(path, options);
  }

  // @ts-expect-error: TODO remove after merging https://github.com/DefinitelyTyped/DefinitelyTyped/pull/59990
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
};

export default defaultResolver;

/*
 * helper functions
 */

function readPackageSync(_: unknown, file: string): PackageJson {
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

    // self-reference
    const closestPackageJson = findClosestPackageJson(options.basedir);
    if (closestPackageJson) {
      const pkg = readPackageCached(closestPackageJson);

      if (pkg.name === moduleName && pkg.exports) {
        const subpath = segments.join('/') || '.';

        const resolved = resolveExports(
          pkg,
          subpath,
          createResolveOptions(options.conditions),
        );

        if (!resolved) {
          throw new Error(
            '`exports` exists, but no results - this is a bug in Jest. Please report an issue',
          );
        }

        return pathResolve(dirname(closestPackageJson), resolved);
      }
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
        const subpath = segments.join('/') || '.';

        const resolved = resolveExports(
          pkg,
          subpath,
          createResolveOptions(options.conditions),
        );

        if (!resolved) {
          throw new Error(
            '`exports` exists, but no results - this is a bug in Jest. Please report an issue',
          );
        }

        return pathResolve(dirname(packageJsonPath), resolved);
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
