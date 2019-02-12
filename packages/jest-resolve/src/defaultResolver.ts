/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs';
import path from 'path';
import browserResolve from 'browser-resolve';
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
  const resolve = options.browser ? browserResolve.sync : resolveSync;

  return resolve(path, {
    basedir: options.basedir,
    defaultResolver,
    extensions: options.extensions,
    moduleDirectory: options.moduleDirectory,
    paths: options.paths,
    rootDir: options.rootDir,
  });
}

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
    const dirs = nodeModulesPaths(basedir, {
      moduleDirectory: options.moduleDirectory,
      paths,
    });
    for (let i = 0; i < dirs.length; i++) {
      const resolveTarget = path.join(dirs[i], target);
      const result = tryResolve(resolveTarget);
      if (result) {
        return result;
      }
    }
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
    if (!isDirectory(name)) {
      return undefined;
    }

    const pkgfile = path.join(name, 'package.json');
    let pkgmain;
    try {
      const body = fs.readFileSync(pkgfile, 'utf8');
      pkgmain = JSON.parse(body).main;
    } catch (e) {}

    if (pkgmain && !isCurrentDirectory(pkgmain)) {
      const resolveTarget = path.resolve(name, pkgmain);
      const result = tryResolve(resolveTarget);
      if (result) {
        return result;
      }
    }

    return resolveAsFile(path.join(name, 'index'));
  }
}

/*
 * helper functions
 */
function isFile(file: Config.Path): boolean {
  let result;

  try {
    const stat = fs.statSync(file);
    result = stat.isFile() || stat.isFIFO();
  } catch (e) {
    if (!(e && e.code === 'ENOENT')) {
      throw e;
    }
    result = false;
  }

  return result;
}

function isDirectory(dir: Config.Path): boolean {
  let result;

  try {
    const stat = fs.statSync(dir);
    result = stat.isDirectory();
  } catch (e) {
    if (!(e && (e.code === 'ENOENT' || e.code === 'ENOTDIR'))) {
      throw e;
    }
    result = false;
  }

  return result;
}

function isCurrentDirectory(testPath: Config.Path): boolean {
  return path.resolve('.') === path.resolve(testPath);
}
