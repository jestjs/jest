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
import {resolve as resolveImports} from 'resolve.imports';
import {
  findClosestPackageJson,
  isDirectory,
  isFile,
  readPackageCached,
  realpathSync,
} from './fileWalkers';
import type {PackageJSON} from './types';

/**
 * Allows transforming parsed `package.json` contents.
 *
 * @param pkg - Parsed `package.json` contents.
 * @param file - Path to `package.json` file.
 * @param dir - Directory that contains the `package.json`.
 *
 * @returns Transformed `package.json` contents.
 */
export type PackageFilter = (
  pkg: PackageJSON,
  file: string,
  dir: string,
) => PackageJSON;

/**
 * Allows transforming a path within a package.
 *
 * @param pkg - Parsed `package.json` contents.
 * @param path - Path being resolved.
 * @param relativePath - Path relative from the `package.json` location.
 *
 * @returns Relative path that will be joined from the `package.json` location.
 */
export type PathFilter = (
  pkg: PackageJSON,
  path: string,
  relativePath: string,
) => string;

export type ResolverOptions = {
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
  packageFilter?: PackageFilter;
  /** Allows transforms a path within a package. */
  pathFilter?: PathFilter;
  /** Current root directory. */
  rootDir?: string;
};

type UpstreamResolveOptionsWithConditions = UpstreamResolveOptions &
  ResolverOptions;

export type SyncResolver = (path: string, options: ResolverOptions) => string;
export type AsyncResolver = (
  path: string,
  options: ResolverOptions,
) => Promise<string>;

export type Resolver = SyncResolver | AsyncResolver;

const defaultResolver: SyncResolver = (path, options) => {
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

  const result = resolveSync(pathToResolve, resolveOptions);

  // Dereference symlinks to ensure we don't create a separate
  // module instance depending on how it was referenced.
  return realpathSync(result);
};

export default defaultResolver;

/*
 * helper functions
 */

function readPackageSync(_: unknown, file: string): PackageJSON {
  return readPackageCached(file);
}

function getPathInModule(
  path: string,
  options: UpstreamResolveOptionsWithConditions,
): string {
  if (shouldIgnoreRequestForExports(path)) {
    return path;
  }

  if (path.startsWith('#')) {
    const closestPackageJson = findClosestPackageJson(options.basedir);

    if (!closestPackageJson) {
      throw new Error(
        `Jest: unable to locate closest package.json from ${options.basedir} when resolving import "${path}"`,
      );
    }

    const pkg = readPackageCached(closestPackageJson);

    const resolved = resolveImports(
      {
        base: options.basedir,
        content: pkg,
        path: dirname(closestPackageJson),
      },
      path,
      createImportsResolveOptions(options.conditions),
    );

    if (!resolved) {
      throw new Error(
        '`imports` exists, but no results - this is a bug in Jest. Please report an issue',
      );
    }

    if (resolved.startsWith('.')) {
      return pathResolve(dirname(closestPackageJson), resolved);
    }

    // this is an external module, re-resolve it
    return defaultResolver(resolved, options);
  }

  const segments = path.split('/');

  let moduleName = segments.shift();

  if (moduleName) {
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

function createImportsResolveOptions(conditions: Array<string> | undefined) {
  return {
    conditions: conditions
      ? [...conditions, 'default']
      : ['node', 'require', 'default'],
  };
}

// if it's a relative import or an absolute path, imports/exports are ignored
const shouldIgnoreRequestForExports = (path: string) =>
  path.startsWith('.') || isAbsolute(path);
