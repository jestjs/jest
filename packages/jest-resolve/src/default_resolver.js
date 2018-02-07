/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Path} from 'types/Config';

import browserResolve from 'browser-resolve';

type ResolverOptions = {|
  basedir: Path,
  browser?: boolean,
  extensions?: Array<string>,
  module?: boolean,
  moduleDirectory?: Array<string>,
  paths?: ?Array<Path>,
  rootDir: ?Path,
|};

export default function defaultResolver(
  path: Path,
  options: ResolverOptions,
): Path {
  const resolve = options.browser ? browserResolve.sync : resolveSync;

  return resolve(path, {
    basedir: options.basedir,
    extensions: options.extensions,
    module: options.module,
    moduleDirectory: options.moduleDirectory,
    paths: options.paths,
    rootDir: options.rootDir,
  });
}

/*
 * Adapted from: https://github.com/substack/node-resolve
 */
type ErrorWithCode = Error & {code?: string};

import fs from 'fs';
import path from 'path';
import isBuiltinModule from './is_builtin_module';

import nodeModulesPaths from './node_modules_paths';

const REGEX_RELATIVE_IMPORT = /^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[\\\/])/;
const REQUIRED_BY_MODULE_FIELD_CACHE = {};

function resolveSync(target: Path, options: ResolverOptions): Path {
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

  const err: ErrorWithCode = new Error(
    "Cannot find module '" + target + "' from '" + basedir + "'",
  );
  err.code = 'MODULE_NOT_FOUND';
  throw err;

  /*
   * contextual helper functions
   */
  function tryResolve(name: Path): ?Path {
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

  function resolveAsFile(name: Path): ?Path {
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

  function resolveAsDirectory(name: Path): ?Path {
    if (!isDirectory(name)) {
      return undefined;
    }

    let pkgentry, isRequiredByModuleField;
    try {
      const pkgfile = getPackageFile(name);

      if (hasModuleField(pkgfile)) {
        isRequiredByModuleField = true;
        pkgentry = pkgfile.module;
      } else {
        pkgentry = pkgfile.main;
      }
    } catch (e) {}

    if (pkgentry && pkgentry !== '.') {
      const resolveTarget = path.resolve(name, pkgentry);

      if (isRequiredByModuleField) {
        REQUIRED_BY_MODULE_FIELD_CACHE[name] = true;
      }

      const result = tryResolve(resolveTarget);
      if (result) {
        return result;
      }
    }

    return resolveAsFile(path.join(name, 'index'));
  }
}

function hasModuleField(pkgfile: string): boolean {
  return !!pkgfile.module;
}

function getPackageFile(file: Path): string {
  const pkgfile = path.join(file, 'package.json');

  return JSON.parse(fs.readFileSync(pkgfile, 'utf8'));
}

export function couldBeRequiredByModuleField(file: Path): boolean {
  return !!Object.keys(REQUIRED_BY_MODULE_FIELD_CACHE)
    .find(moduleFieldCache => file.startsWith(moduleFieldCache));
}

/*
 * helper functions
 */
function isFile(file: Path): boolean {
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

function isDirectory(dir: Path): boolean {
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
