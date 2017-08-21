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
 * resolve logic, adapted from resolve.sync
 */
type ErrorWithCode = Error & {code?: string};

const fs = require('fs');
const path = require('path');

function resolveSync(x: Path, options: ResolverOptions): Path {
  const readFileSync = fs.readFileSync;

  const extensions = options.extensions || ['.js'];
  const basedir = options.basedir;

  options.paths = options.paths || [];

  if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[\\\/])/.test(x)) {
    let res = path.resolve(basedir, x);
    if (x === '..') res += '/';
    const m = loadAsFileSync(res) || loadAsDirectorySync(res);
    if (m) return m;
  } else {
    const n = loadNodeModulesSync(x, basedir);
    if (n) return n;
  }

  const err: ErrorWithCode = new Error(
    "Cannot find module '" + x + "' from '" + basedir + "'",
  );
  err.code = 'MODULE_NOT_FOUND';
  throw err;

  /*
   * helper functions
   */
  function isFile(file: Path): boolean {
    try {
      const stat = fs.statSync(file);
      return stat.isFile() || stat.isFIFO();
    } catch (e) {
      if (e && e.code === 'ENOENT') return false;
      throw e;
    }
  }

  function loadAsFileSync(x: Path): ?Path {
    if (isFile(x)) {
      return x;
    }

    for (let i = 0; i < extensions.length; i++) {
      const file = x + extensions[i];
      if (isFile(file)) {
        return file;
      }
    }

    return undefined;
  }

  function loadAsDirectorySync(x: Path): ?Path {
    const pkgfile = path.join(x, '/package.json');
    if (isFile(pkgfile)) {
      const body = readFileSync(pkgfile, 'utf8');
      try {
        const pkgmain = JSON.parse(body).main;
        if (pkgmain) {
          const m = loadAsFileSync(path.resolve(x, pkgmain));
          if (m) return m;
          const n = loadAsDirectorySync(path.resolve(x, pkgmain));
          if (n) return n;
        }
      } catch (e) {}
    }

    return loadAsFileSync(path.join(x, '/index'));
  }

  function loadNodeModulesSync(x: Path, basedir: Path): ?Path {
    const dirs = nodeModulesPaths(basedir);
    for (let i = 0; i < dirs.length; i++) {
      const dir = dirs[i];
      const m = loadAsFileSync(path.join(dir, '/', x));
      if (m) return m;
      const n = loadAsDirectorySync(path.join(dir, '/', x));
      if (n) return n;
    }

    return undefined;
  }

  function nodeModulesPaths(basedir: Path): Path[] {
    const modules = ['node_modules'];

    // ensure that `basedir` is an absolute path at this point,
    // resolving against the process' current working directory
    basedir = path.resolve(basedir);

    let prefix = '/';
    if (/^([A-Za-z]:)/.test(basedir)) {
      prefix = '';
    } else if (/^\\\\/.test(basedir)) {
      prefix = '\\\\';
    }

    const paths = [basedir];
    let parsed = path.parse(basedir);
    while (parsed.dir !== paths[paths.length - 1]) {
      paths.push(parsed.dir);
      parsed = path.parse(parsed.dir);
    }

    const dirs = paths.reduce((dirs, aPath) => {
      return dirs.concat(
        modules.map(moduleDir => {
          return path.join(prefix, aPath, moduleDir);
        }),
      );
    }, []);

    return options.paths ? dirs.concat(options.paths) : dirs;
  }
}
