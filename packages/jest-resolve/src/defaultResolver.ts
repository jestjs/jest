/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import pnpResolver from 'jest-pnp-resolver';
import resolveAsync = require('resolve');
import type {Config} from '@jest/types';
import {
  PkgJson,
  isDirectoryAsync,
  isDirectorySync,
  isFileAsync,
  isFileSync,
  readPackageCached,
  realpathAsync,
  realpathSync,
} from './fileWalkers';

const resolveSync = resolveAsync.sync;

export interface ResolverOptions extends resolveAsync.Opts {
  basedir: Config.Path;
  browser?: boolean;
  conditions?: Array<string>;
  defaultResolver: typeof defaultResolver;
  extensions?: Array<string>;
  rootDir?: Config.Path;
}

type ResolverOptionsAsync = Omit<ResolverOptions, 'defaultResolver'> & {
  defaultResolver: typeof defaultResolverAsync;
};

// https://github.com/facebook/jest/pull/10617
declare global {
  namespace NodeJS {
    export interface ProcessVersions {
      pnp?: any;
    }
  }
}

export function defaultResolver(
  path: Config.Path,
  options: ResolverOptions,
): Config.Path {
  // Yarn 2 adds support to `resolve` automatically so the pnpResolver is only
  // needed for Yarn 1 which implements version 1 of the pnp spec
  if (process.versions.pnp === '1') {
    return pnpResolver(path, options);
  }

  const result = resolveSync(path, getSyncResolveOptions(options));

  // Dereference symlinks to ensure we don't create a separate
  // module instance depending on how it was referenced.
  return realpathSync(result);
}

export async function defaultResolverAsync(
  path: Config.Path,
  options: ResolverOptionsAsync,
): Promise<Config.Path> {
  // Yarn 2 adds support to `resolve` automatically so the pnpResolver is only
  // needed for Yarn 1 which implements version 1 of the pnp spec
  if (process.versions.pnp === '1') {
    // @ts-expect-error until https://github.com/arcanis/jest-pnp-resolver/pull/10 is released
    return pnpResolver(path, options);
  }

  return new Promise((resolve, reject) => {
    function resolveCb(err: Error | null, result?: string) {
      if (err) {
        reject(err);
      }
      if (result) {
        resolve(realpathSync(result));
      }
    }
    const opts = getAsyncResolveOptions(options);
    resolveAsync(path, opts, resolveCb);
  });
}

/**
 * getSyncResolveOptions returns resolution options that are used synchronously.
 */
function getSyncResolveOptions(
  options: ResolverOptions,
): resolveAsync.SyncOpts {
  return {
    ...options,
    isDirectory: isDirectorySync,
    isFile: isFileSync,
    preserveSymlinks: false,
    readPackageSync,
    realpathSync,
  };
}

/**
 * getAsyncResolveOptions returns resolution options that are used asynchronously.
 */
function getAsyncResolveOptions(
  options: ResolverOptionsAsync,
): resolveAsync.AsyncOpts {
  return {
    ...options,
    isDirectory: isDirectoryAsync,
    isFile: isFileAsync,
    preserveSymlinks: false,
    readPackage: readPackageAsync,
    realpath: realpathAsync,
  };
}

/*
 * helper functions
 */

function readPackageSync(_: unknown, file: Config.Path): PkgJson {
  return readPackageCached(file);
}

function readPackageAsync(
  _: unknown,
  pkgfile: string,
  cb: (err: Error | null, pkgJson?: Record<string, unknown>) => void,
): void {
  try {
    // TODO: create an async version of readPackageCached
    const pkgJson = readPackageCached(pkgfile);
    cb(null, pkgJson);
  } catch (err: any) {
    cb(err);
  }
}
