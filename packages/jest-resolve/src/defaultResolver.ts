/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs';
import * as path from 'path';
import {sync as browserResolve} from 'browser-resolve';
import pnpResolver from 'jest-pnp-resolver';
import {Config} from '@jest/types';
import isBuiltinModule from './isBuiltinModule';
import nodeModulesPaths from './nodeModulesPaths';

type ResolverOptions = {
  basedir: Config.Path;
  browser?: boolean;
  defaultResolver: typeof defaultResolver;
  extensions?: Array<string>;
  moduleDirectory?: Array<string>;
  paths?: Array<Config.Path>;
  rootDir?: Config.Path;
};

export default function defaultResolver(
  path: Config.Path,
  options: ResolverOptions,
): Config.Path {
  // @ts-ignore: the "pnp" version named isn't in DefinitelyTyped
  if (process.versions.pnp) {
    return pnpResolver(path, options);
  }

  const resolve = options.browser ? browserResolve : resolveSync;

  return resolve(path, {
    basedir: options.basedir,
    defaultResolver,
    extensions: options.extensions,
    moduleDirectory: options.moduleDirectory,
    paths: options.paths,
    rootDir: options.rootDir,
  });
}

export const clearDefaultResolverCache = () => {
  checkedPaths.clear();
};

const REGEX_RELATIVE_IMPORT = /^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[\\\/])/;

function resolveSync(
  target: Config.Path,
  options: ResolverOptions,
): Config.Path {
  const basedir = options.basedir;
  const extensions = options.extensions || ['.js'];
  const paths = options.paths || [];

  if (REGEX_RELATIVE_IMPORT.test(target)) {
    // resolve relative import
    const resolveTarget = path.resolve(basedir, target);
    const result = tryResolve(resolveTarget);
    if (result) {
      return result;
    }
  } else {
    // otherwise search for node_modules
    const paths = nodeModulesPaths(basedir, {
      moduleDirectory: options.moduleDirectory,
      paths,
    });
    return require.resolve(target, { paths });
  }

  if (isBuiltinModule(target)) {
    return target;
  }

  const err: Error & {code?: string} = new Error(
    "Cannot find module '" + target + "' from '" + basedir + "'",
  );
  err.code = 'MODULE_NOT_FOUND';
  throw err;

  /*
   * contextual helper functions
   */
  function tryResolve(name: Config.Path): Config.Path | undefined {
    const dir = path.dirname(name);
    let result;
    if (isDirectory(dir)) {
      result = resolveAsFile(name) || resolveAsDirectory(name);
    }
    if (result) {
      // Dereference symlinks to ensure we don't create a separate
      // module instance depending on how it was referenced.
      result = fs.realpathSync(result);
    }
    return result;
  }

  function resolveAsFile(name: Config.Path): Config.Path | undefined {
    if (isFile(name)) {
      return name;
    }

    for (let i = 0; i < extensions.length; i++) {
      const file = name + extensions[i];
      if (isFile(file)) {
        return file;
      }
    }

    return undefined;
  }

  function resolveAsDirectory(name: Config.Path): Config.Path | undefined {
    try {
      return require.resolve(name);
    } catch {
      return undefined
    }
  }
}

enum IPathType {
  FILE = 1,
  DIRECTORY = 2,
  OTHER = 3,
}
const checkedPaths = new Map<string, IPathType>();
function statSyncCached(path: string): number {
  const result = checkedPaths.get(path);
  if (result !== undefined) {
    return result;
  }

  let stat;
  try {
    stat = fs.statSync(path);
  } catch (e) {
    if (!(e && (e.code === 'ENOENT' || e.code === 'ENOTDIR'))) {
      throw e;
    }
  }

  if (stat) {
    if (stat.isFile() || stat.isFIFO()) {
      checkedPaths.set(path, IPathType.FILE);
      return IPathType.FILE;
    } else if (stat.isDirectory()) {
      checkedPaths.set(path, IPathType.DIRECTORY);
      return IPathType.DIRECTORY;
    }
  }

  checkedPaths.set(path, IPathType.OTHER);
  return IPathType.OTHER;
}

/*
 * helper functions
 */
function isFile(file: Config.Path): boolean {
  return statSyncCached(file) === IPathType.FILE;
}

function isDirectory(dir: Config.Path): boolean {
  return statSyncCached(dir) === IPathType.DIRECTORY;
}
