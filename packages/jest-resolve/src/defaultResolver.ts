/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isBuiltin} from 'node:module';
import {
  type ResolveResult,
  ResolverFactory,
  type NapiResolveOptions as UpstreamResolveOptions,
} from 'unrs-resolver';
import {getResolver, setResolver} from './fileWalkers';

export interface ResolverOptions extends Omit<
  UpstreamResolveOptions,
  'extensions'
> {
  /** Directory to begin resolving from. */
  basedir: string;
  /** List of export conditions. */
  conditions?: ReadonlyArray<string>;
  /** Instance of default resolver. */
  defaultResolver: SyncResolver;
  /** Instance of default async resolver. */
  defaultAsyncResolver: AsyncResolver;
  /** List of file extensions to be considered when resolving. */
  extensions?: ReadonlyArray<string>;
  /**
   * List of directory names to be looked up for modules recursively.
   *
   * @defaultValue
   * The default is `['node_modules']`.
   */
  moduleDirectory?: ReadonlyArray<string>;
  /**
   * List of `require.paths` to use if nothing is found in `node_modules`.
   *
   * @defaultValue
   * The default is `undefined`.
   */
  paths?: ReadonlyArray<string>;
  /** Current root directory. */
  rootDir?: string;
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

/**
 * Whether Node was started with `--preserve-symlinks` / `NODE_PRESERVE_SYMLINKS`.
 *
 * @see https://nodejs.org/api/cli.html#--preserve-symlinks
 */
function shouldPreserveSymlinks(): boolean {
  // `NODE_PRESERVE_SYMLINKS` is on only when exactly `1`, and `--preserve-symlinks`
  // is matched exactly so `--preserve-symlinks-main` (entry point only) is excluded.
  return (
    process.env.NODE_PRESERVE_SYMLINKS === '1' ||
    process.execArgv.includes('--preserve-symlinks') ||
    (process.env.NODE_OPTIONS ?? '')
      .split(/\s+/)
      .includes('--preserve-symlinks')
  );
}

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
  // `builtins` in `unrs-resolver` is static which could be wrong at runtime.
  if (isBuiltin(path)) {
    return path;
  }

  /* eslint-disable prefer-const */
  let {
    basedir,
    conditions,
    conditionNames,
    extensions,
    modules,
    moduleDirectory,
    paths,
    roots,
    rootDir,
    ...rest
    /* eslint-enable prefer-const */
  } = options;

  modules = modules || (moduleDirectory as Array<string>);

  const resolveOptions: UpstreamResolveOptions = {
    conditionNames: conditionNames ||
      (conditions as Array<string> | undefined) || [
        'require',
        'node',
        'default',
      ],
    extensions: extensions as Array<string> | undefined,
    modules,
    roots: roots || (rootDir ? [rootDir] : undefined),
    // Honor Node's `--preserve-symlinks`; `unrs-resolver` realpaths by default.
    // An explicit `symlinks` option still wins via the `...rest` spread below.
    ...(shouldPreserveSymlinks() ? {symlinks: false} : {}),
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
            modules: paths as Array<string>,
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
