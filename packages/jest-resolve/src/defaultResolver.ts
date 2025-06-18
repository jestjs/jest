/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isBuiltin} from 'module';
import {fileURLToPath} from 'url';
import pnpResolver from 'jest-pnp-resolver';
import {
  type ResolveResult,
  ResolverFactory,
  type NapiResolveOptions as UpstreamResolveOptions,
} from 'unrs-resolver';
import {getResolver, setResolver} from './fileWalkers';

export interface ResolverOptions extends UpstreamResolveOptions {
  /** Directory to begin resolving from. */
  basedir: string;
  /** List of export conditions. */
  conditions?: Array<string>;
  /** Instance of default resolver. */
  defaultResolver: SyncResolver;
  /** Instance of default async resolver. */
  defaultAsyncResolver: AsyncResolver;
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

  /**
   * @internal Whether to allow the `jest-pnp-resolver` to be used.
   * @see https://github.com/arcanis/jest-pnp-resolver/blob/ae8e3992349f3b43d1476572e9315e14358e8944/index.js#L49
   */
  allowPnp?: boolean;
}

export type SyncResolver = (path: string, options: ResolverOptions) => string;
export type AsyncResolver = (
  path: string,
  options: ResolverOptions,
) => Promise<string>;

export type Resolver = SyncResolver | AsyncResolver;

const handleResolveResult = (result: ResolveResult) => {
  if (result.error) {
    throw new Error(result.error);
  }
  return result.path!;
};

function baseResolver(path: string, options: ResolverOptions): string;
function baseResolver(
  path: string,
  options: ResolverOptions,
  async: true,
): Promise<string>;
function baseResolver(
  path: string,
  options: ResolverOptions,
  async?: true,
): string | Promise<string> {
  // https://github.com/oxc-project/oxc-resolver/issues/565
  // https://github.com/jestjs/jest/issues/15676
  if (isBuiltin(path)) {
    return path;
  }

  if (process.versions.pnp && options.allowPnp !== false) {
    return pnpResolver(path, options);
  }

  if (path.startsWith('file://')) {
    path = fileURLToPath(path);
  }

  /* eslint-disable prefer-const */
  let {
    basedir,
    conditions,
    conditionNames,
    modules,
    moduleDirectory,
    paths,
    roots,
    rootDir,
    ...rest
    /* eslint-enable prefer-const */
  } = options;

  modules = modules || moduleDirectory;

  const resolveOptions: UpstreamResolveOptions = {
    conditionNames: conditionNames ||
      conditions || ['require', 'node', 'default'],
    modules,
    roots: roots || (rootDir ? [rootDir] : undefined),
    ...rest,
  };

  let unrsResolver = getResolver();

  if (unrsResolver) {
    unrsResolver = unrsResolver.cloneWithOptions(resolveOptions);
  } else {
    unrsResolver = new ResolverFactory(resolveOptions);
  }

  setResolver(unrsResolver);

  const finalResolver = (
    resolve: () => ResolveResult | Promise<ResolveResult>,
  ) => {
    const resolveWithPathsFallback = (result: ResolveResult) => {
      if (!result.path && paths?.length) {
        const modulesArr =
          modules == null || Array.isArray(modules) ? modules : [modules];
        if (modulesArr?.length) {
          paths = paths.filter(p => !modulesArr.includes(p));
        }
        if (paths.length > 0) {
          unrsResolver = unrsResolver!.cloneWithOptions({
            ...resolveOptions,
            modules: paths,
          });
          setResolver(unrsResolver);
          return resolve();
        }
      }
      return result;
    };
    const result = resolve();
    if ('then' in result) {
      return result.then(resolveWithPathsFallback).then(handleResolveResult);
    }
    return handleResolveResult(
      resolveWithPathsFallback(result) as ResolveResult,
    );
  };

  return finalResolver(() =>
    async
      ? unrsResolver!.async(basedir, path)
      : unrsResolver!.sync(basedir, path),
  );
}

export const defaultResolver: SyncResolver = baseResolver;

export const defaultAsyncResolver: AsyncResolver = (
  path: string,
  options: ResolverOptions,
) => baseResolver(path, options, true);

export default defaultResolver;
