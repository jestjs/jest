/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Path} from 'types/Config';

import browserResolve from 'browser-resolve';

type ResolverOptions = {|
  basedir: Path,
  browser?: boolean,
  extensions?: Array<string>,
  moduleDirectory?: Array<string>,
  paths?: ?Array<Path>,
|};

function defaultResolver(path: Path, options: ResolverOptions): Path {
  const resolve = options.browser ? browserResolve.sync : resolveSync;

  return resolve(path, {
    basedir: options.basedir,
    extensions: options.extensions,
    moduleDirectory: options.moduleDirectory,
    paths: options.paths,
  });
}

module.exports = defaultResolver;

/*
 * Adapted from: https://github.com/substack/node-resolve
 */
type ErrorWithCode = Error & {code?: string};

import fs from 'fs';
import path from 'path';
import isBuiltinModule from 'is-builtin-module';

import nodeModulesPaths from './node_modules_paths';

const REGEX_RELATIVE_IMPORT = /^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[\\\/])/;

function resolveSync(x: Path, options: ResolverOptions): Path {
  const readFileSync = fs.readFileSync;

  const extensions = options.extensions || ['.js'];
  const basedir = options.basedir;

  options.paths = options.paths || [];

  if (REGEX_RELATIVE_IMPORT.test(x)) {
    // resolve relative import
    let target = path.resolve(basedir, x);
    if (x === '..') target += '/';
    const m = loadAsFileSync(target) || loadAsDirectorySync(target);
    if (m) return m;
  } else {
    // otherwise search for node_modules
    const dirs = nodeModulesPaths(basedir, {
      moduleDirectory: options.moduleDirectory,
      paths: options.paths,
    });
    for (let i = 0; i < dirs.length; i++) {
      const dir = dirs[i];
      if (isDirectory(dir)) {
        const target = path.join(dir, '/', x);
        const m = loadAsFileSync(target) || loadAsDirectorySync(target);
        if (m) return m;
      }
    }
  }

  if (isBuiltinModule(x)) return x;

  const err: ErrorWithCode = new Error(
    "Cannot find module '" + x + "' from '" + basedir + "'",
  );
  err.code = 'MODULE_NOT_FOUND';
  throw err;

  /*
   * helper functions
   */
  function loadAsFileSync(x: Path): ?Path {
    if (isFile(x)) return x;

    for (let i = 0; i < extensions.length; i++) {
      const file = x + extensions[i];
      if (isFile(file)) return file;
    }

    return undefined;
  }

  function loadAsDirectorySync(x: Path): ?Path {
    if (!isDirectory(x)) return undefined;

    const pkgfile = path.join(x, '/package.json');
    if (isFile(pkgfile)) {
      const body = readFileSync(pkgfile, 'utf8');
      try {
        const pkgmain = JSON.parse(body).main;
        if (pkgmain) {
          const target = path.resolve(x, pkgmain);
          const m = loadAsFileSync(target) || loadAsDirectorySync(target);
          if (m) return m;
        }
      } catch (e) {}
    }

    return loadAsFileSync(path.join(x, '/index'));
  }
}

/*
 * helper functions
 */
const memoIsFile: {[Path]: boolean} = {};
function isFile(file: Path): boolean {
  let result = memoIsFile[file];
  if (result !== undefined) return result;

  try {
    const stat = fs.statSync(file);
    result = stat.isFile() || stat.isFIFO();
  } catch (e) {
    if (!(e && e.code === 'ENOENT')) throw e;
    result = false;
  }

  return (memoIsFile[file] = result);
}

const memoIsDirectory: {[Path]: boolean} = {};
function isDirectory(dir: Path): boolean {
  let result = memoIsDirectory[dir];
  if (result !== undefined) return result;

  try {
    const stat = fs.statSync(dir);
    result = stat.isDirectory();
  } catch (e) {
    if (!(e && e.code === 'ENOENT')) throw e;
    result = false;
  }

  return (memoIsDirectory[dir] = result);
}
