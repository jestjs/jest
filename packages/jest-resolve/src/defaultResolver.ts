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
import {
  getAnyResolver,
  getResolver,
  setResolver,
  shouldPreserveSymlinks,
} from './fileWalkers';

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

const KEY_SEPARATOR = '\u0001';
// Distinct from an empty array's join: for example `extensions: []` and
// `extensions: undefined` configure the factory differently.
const ABSENT = '\u0002';

const arrayCacheKeys = new WeakMap<ReadonlyArray<string>, string>();

// JSON escapes control characters, so no element can smuggle a
// KEY_SEPARATOR or ABSENT byte into the composed key.
function cacheKeyForArray(array: ReadonlyArray<string> | undefined): string {
  if (array == null) {
    return ABSENT;
  }
  let key = arrayCacheKeys.get(array);
  if (key === undefined) {
    key = JSON.stringify(array);
    arrayCacheKeys.set(array, key);
  }
  return key;
}

function cacheKeyForValue(value: string | undefined): string {
  return value == null ? ABSENT : JSON.stringify(value);
}

function resolverForOptions(
  resolveOptions: UpstreamResolveOptions,
  key = `json${KEY_SEPARATOR}${JSON.stringify(resolveOptions)}`,
): ResolverFactory {
  let resolver = getResolver(key);
  if (!resolver) {
    // Clone from an existing factory when there is one, so every options
    // shape shares the same underlying fs cache.
    const existingResolver = getAnyResolver();
    resolver = existingResolver
      ? existingResolver.cloneWithOptions(resolveOptions)
      : new ResolverFactory(resolveOptions);
    setResolver(key, resolver);
  }
  return resolver;
}

// The custom-resolver fall-through hooks ride along in the rest object but
// are not factory options - only other passthrough keys disqualify the
// fast key.
function hasPassthroughOptions(rest: object): boolean {
  for (const key in rest) {
    if (key !== 'defaultAsyncResolver' && key !== 'defaultResolver') {
      return true;
    }
  }
  return false;
}

export function baseResolver(
  path: string,
  options: ResolverOptions,
): ResolveResult;
export function baseResolver(
  path: string,
  options: ResolverOptions,
  async: true,
): Promise<ResolveResult>;
export function baseResolver(
  path: string,
  options: ResolverOptions,
  async?: true,
): ResolveResult | Promise<ResolveResult> {
  // `builtins` in `unrs-resolver` is static which could be wrong at runtime.
  if (isBuiltin(path)) {
    return {path};
  }

  const {
    basedir,
    conditions,
    conditionNames,
    extensions,
    modules: modulesOption,
    moduleDirectory,
    paths,
    roots,
    rootDir,
    ...rest
  } = options;

  const modules = modulesOption || (moduleDirectory as Array<string>);

  // Options without passthrough keys are fully described by a handful of
  // long-lived arrays and scalars, so the factory key composes from
  // per-array cached strings instead of serializing the whole object. The
  // preserve-symlinks setting is constant per resolver-cache generation, so
  // it needs no key part.
  let fastKey: string | undefined;
  if (!hasPassthroughOptions(rest)) {
    const conditionsKey = cacheKeyForArray(
      conditionNames || (conditions as Array<string> | undefined),
    );
    const extensionsKey = cacheKeyForArray(extensions);
    const modulesKey = Array.isArray(modules)
      ? cacheKeyForArray(modules)
      : cacheKeyForValue(modules);
    const rootsKey = roots
      ? cacheKeyForArray(roots)
      : cacheKeyForValue(rootDir);
    fastKey = ['fast', conditionsKey, extensionsKey, modulesKey, rootsKey].join(
      KEY_SEPARATOR,
    );
  }

  // Only built when no cached factory serves the fast key.
  let resolveOptions: UpstreamResolveOptions | undefined;
  function getResolveOptions(): UpstreamResolveOptions {
    resolveOptions ??= {
      conditionNames: conditionNames ||
        (conditions as Array<string> | undefined) || [
          'require',
          'node',
          'default',
        ],
      extensions: extensions as Array<string> | undefined,
      modules,
      roots: roots || (rootDir ? [rootDir] : undefined),
      // Honor Node's `--preserve-symlinks`; `unrs-resolver` realpaths by
      // default. An explicit `symlinks` option still wins via `...rest`.
      ...(shouldPreserveSymlinks() ? {symlinks: false} : {}),
      ...rest,
    };
    return resolveOptions;
  }

  let unrsResolver = fastKey == null ? undefined : getResolver(fastKey);
  unrsResolver ??= resolverForOptions(getResolveOptions(), fastKey);

  function attemptResolve(): ResolveResult | Promise<ResolveResult> {
    return async
      ? unrsResolver!.async(basedir, path)
      : unrsResolver!.sync(basedir, path);
  }

  // `require.paths` semantics: when nothing resolves in the regular module
  // directories, retry with the caller-provided paths as the module
  // directories. Applies at most once.
  function resolveWithPathsFallback(
    result: ResolveResult,
  ): ResolveResult | Promise<ResolveResult> {
    if (result.path || !paths?.length) {
      return result;
    }

    const moduleDirectories =
      modules == null || Array.isArray(modules) ? (modules ?? []) : [modules];
    const fallbackPaths = paths.filter(
      fallbackPath => !moduleDirectories.includes(fallbackPath),
    );
    if (fallbackPaths.length === 0) {
      return result;
    }

    unrsResolver = resolverForOptions({
      ...getResolveOptions(),
      modules: fallbackPaths as Array<string>,
    });
    return attemptResolve();
  }

  const result = attemptResolve();
  if ('then' in result) {
    return result.then(resolveWithPathsFallback);
  }
  return resolveWithPathsFallback(result) as ResolveResult;
}

export const defaultResolver: SyncResolver = (path, options) =>
  handleResolveResult(baseResolver(path, options));

export const defaultAsyncResolver: AsyncResolver = async (path, options) =>
  handleResolveResult(await baseResolver(path, options, true));

export default defaultResolver;
