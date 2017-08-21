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

function defaultResolver(path: Path, options: ResolverOptions) {
  const resolve = options.browser ? browserResolve.sync : resolveSync;

  return resolve(path, {
    basedir: options.basedir,
    extensions: options.extensions,
    moduleDirectory: options.moduleDirectory,
    paths: options.paths,
  });
}

module.exports = defaultResolver;

/**
 * resolve logic, taken directly from resolve.sync
 */

const fs = require('fs');
const path = require('path');

function resolveSync(x, options) {
  const opts = options || {};
  const isFile =
    opts.isFile ||
    function(file) {
      try {
        const stat = fs.statSync(file);
        return stat.isFile() || stat.isFIFO();
      } catch (e) {
        if (e && e.code === 'ENOENT') return false;
        throw e;
      }
    };
  const readFileSync = opts.readFileSync || fs.readFileSync;

  const extensions = opts.extensions || ['.js'];
  const y = opts.basedir;

  opts.paths = opts.paths || [];

  if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[\\\/])/.test(x)) {
    let res = path.resolve(y, x);
    if (x === '..') res += '/';
    const m = loadAsFileSync(res) || loadAsDirectorySync(res);
    if (m) return m;
  } else {
    const n = loadNodeModulesSync(x, y);
    if (n) return n;
  }

  const err = new Error("Cannot find module '" + x + "' from '" + y + "'");
  err.code = 'MODULE_NOT_FOUND';
  throw err;

  function loadAsFileSync(x) {
    if (isFile(x)) {
      return x;
    }

    for (let i = 0; i < extensions.length; i++) {
      const file = x + extensions[i];
      if (isFile(file)) {
        return file;
      }
    }
  }

  function loadAsDirectorySync(x) {
    const pkgfile = path.join(x, '/package.json');
    if (isFile(pkgfile)) {
      const body = readFileSync(pkgfile, 'utf8');
      try {
        let pkg = JSON.parse(body);
        if (opts.packageFilter) {
          pkg = opts.packageFilter(pkg, x);
        }

        if (pkg.main) {
          const m = loadAsFileSync(path.resolve(x, pkg.main));
          if (m) return m;
          const n = loadAsDirectorySync(path.resolve(x, pkg.main));
          if (n) return n;
        }
      } catch (e) {}
    }

    return loadAsFileSync(path.join(x, '/index'));
  }

  function loadNodeModulesSync(x, start) {
    const dirs = nodeModulesPaths(start, opts);
    for (let i = 0; i < dirs.length; i++) {
      const dir = dirs[i];
      const m = loadAsFileSync(path.join(dir, '/', x));
      if (m) return m;
      const n = loadAsDirectorySync(path.join(dir, '/', x));
      if (n) return n;
    }
  }
}

/**
 * node-modules-path, taken directly from resolve.sync
 */

function nodeModulesPaths(start, opts) {
  const modules =
    opts && opts.moduleDirectory
      ? [].concat(opts.moduleDirectory)
      : ['node_modules'];

  // ensure that `start` is an absolute path at this point,
  // resolving against the process' current working directory
  start = path.resolve(start);

  let prefix = '/';
  if (/^([A-Za-z]:)/.test(start)) {
    prefix = '';
  } else if (/^\\\\/.test(start)) {
    prefix = '\\\\';
  }

  const paths = [start];
  let parsed = path.parse(start);
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

  return opts && opts.paths ? dirs.concat(opts.paths) : dirs;
}
