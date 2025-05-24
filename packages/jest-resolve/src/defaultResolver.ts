/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fileURLToPath} from 'url';
import {
  ResolverFactory,
  type NapiResolveOptions as UpstreamResolveOptions,
} from 'unrs-resolver';

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
  /** Current root directory. */
  rootDir?: string;
}

export type SyncResolver = (path: string, options: ResolverOptions) => string;
export type AsyncResolver = (
  path: string,
  options: ResolverOptions,
) => Promise<string>;

export type Resolver = SyncResolver | AsyncResolver;

const defaultResolver: SyncResolver = (
  path,
  {
    basedir,
    conditions,
    conditionNames,
    modules,
    moduleDirectory,
    paths,
    roots,
    rootDir,
    ...rest
  },
) => {
  if (path.startsWith('file://')) {
    path = fileURLToPath(path);
  }

  modules = modules || moduleDirectory;

  const resolveOptions: UpstreamResolveOptions = {
    conditionNames: conditionNames ||
      conditions || ['require', 'node', 'default'],
    modules,
    roots: roots || (rootDir ? [rootDir] : undefined),
    ...rest,
  };

  let unrsResolver = new ResolverFactory(resolveOptions);

  let result = unrsResolver.sync(basedir, path);

  if (!result.path && paths?.length) {
    const modulesArr =
      modules == null || Array.isArray(modules) ? modules : [modules];
    if (modulesArr?.length) {
      paths = paths.filter(p => !modulesArr.includes(p));
    }
    if (paths.length > 0) {
      unrsResolver = unrsResolver.cloneWithOptions({
        ...resolveOptions,
        modules: paths,
      });
      result = unrsResolver.sync(basedir, path);
    }
  }

  if (result.error) {
    throw new Error(result.error);
  }

  return result.path!;
};

export default defaultResolver;
