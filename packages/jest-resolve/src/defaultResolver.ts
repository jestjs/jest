/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ResolverFactory,
  type NapiResolveOptions as UpstreamResolveOptions,
} from 'unrs-resolver';
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
  dir?: string,
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

export interface ResolverOptions extends UpstreamResolveOptions {
  /** Directory to begin resolving from. */
  basedir: string;
  /** List of export conditions. */
  conditions?: Array<string>;
  /** Instance of default resolver. */
  defaultResolver: typeof defaultResolver;
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
}

export type SyncResolver = (path: string, options: ResolverOptions) => string;
export type AsyncResolver = (
  path: string,
  options: ResolverOptions,
) => Promise<string>;

export type Resolver = SyncResolver | AsyncResolver;

const defaultResolver: SyncResolver = (path, options) => {
  const resolveOptions: UpstreamResolveOptions = {
    ...options,
    conditionNames: options.conditionNames || options.conditions,
    modules: options.modules || options.moduleDirectory,
  };

  const unrsResolver = new ResolverFactory(resolveOptions);

  const result = unrsResolver.sync(options.basedir, path);

  if (result.error) {
    throw new Error(result.error);
  }

  return result.path!;
};

export default defaultResolver;
