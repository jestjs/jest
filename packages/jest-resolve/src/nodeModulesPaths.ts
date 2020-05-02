/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Adapted from: https://github.com/substack/node-resolve
 */

import * as path from 'path';
import type {Config} from '@jest/types';
import {tryRealpath} from 'jest-util';

type NodeModulesPathsOptions = {
  moduleDirectory?: Array<string>;
  paths?: Array<Config.Path>;
};

export default function nodeModulesPaths(
  basedir: Config.Path,
  options: NodeModulesPathsOptions,
): Array<Config.Path> {
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
  } catch (err) {
    // realpath can throw, e.g. on mapped drives
    physicalBasedir = basedirAbs;
  }

  const paths: Array<Config.Path> = [physicalBasedir];
  let parsed = path.parse(physicalBasedir);
  while (parsed.dir !== paths[paths.length - 1]) {
    paths.push(parsed.dir);
    parsed = path.parse(parsed.dir);
  }

  const dirs = paths
    .reduce<Array<Config.Path>>(
      (dirs, aPath) =>
        dirs.concat(
          modules.map(moduleDir =>
            path.isAbsolute(moduleDir)
              ? aPath === basedirAbs
                ? moduleDir
                : ''
              : path.join(prefix, aPath, moduleDir),
          ),
        ),
      [],
    )
    .filter(dir => dir !== '');

  return options.paths ? dirs.concat(options.paths) : dirs;
}
