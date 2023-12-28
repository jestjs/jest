/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Adapted from: https://github.com/substack/node-resolve
 */

import * as path from 'path';
import {tryRealpath} from 'jest-util';

type NodeModulesPathsOptions = {
  moduleDirectory?: Array<string>;
  paths?: Array<string>;
};

export default function nodeModulesPaths(
  basedir: string,
  options: NodeModulesPathsOptions,
): Array<string> {
  const modules =
    options && options.moduleDirectory
      ? Array.from(options.moduleDirectory)
      : ['node_modules'];

  // ensure that `basedir` is an absolute path at this point,
  // resolving against the process' current working directory
  const basedirAbs = path.resolve(basedir);

  let prefix = '/';
  if (/^([A-Za-z]:)/.test(basedirAbs)) {
    prefix = '';
  } else if (/^\\\\/.test(basedirAbs)) {
    prefix = '\\\\';
  }

  // The node resolution algorithm (as implemented by NodeJS and TypeScript)
  // traverses parents of the physical path, not the symlinked path
  let physicalBasedir;
  try {
    physicalBasedir = tryRealpath(basedirAbs);
  } catch {
    // realpath can throw, e.g. on mapped drives
    physicalBasedir = basedirAbs;
  }

  const paths: Array<string> = [physicalBasedir];
  let parsed = path.parse(physicalBasedir);
  while (parsed.dir !== paths[paths.length - 1]) {
    paths.push(parsed.dir);
    parsed = path.parse(parsed.dir);
  }

  const dirs = paths.reduce<Array<string>>((dirs, aPath) => {
    for (const moduleDir of modules) {
      if (path.isAbsolute(moduleDir)) {
        if (aPath === basedirAbs && moduleDir) {
          dirs.push(moduleDir);
        }
      } else {
        dirs.push(path.join(prefix, aPath, moduleDir));
      }
    }

    return dirs;
  }, []);

  if (options.paths) {
    dirs.push(...options.paths);
  }

  return dirs;
}

function findGlobalPaths(): Array<string> {
  const {root} = path.parse(process.cwd());
  const globalPath = path.join(root, 'node_modules');
  const resolvePaths = require.resolve.paths('/');

  if (resolvePaths) {
    // the global paths start one after the root node_modules
    const rootIndex = resolvePaths.indexOf(globalPath);
    return rootIndex > -1 ? resolvePaths.slice(rootIndex + 1) : [];
  }
  return [];
}
export const GlobalPaths = findGlobalPaths();
