/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Config} from 'types/Config';

const HasteMap = require('jest-haste-map');
const SNAPSHOT_EXTENSION = require('jest-snapshot').EXTENSION;

export type Options = {
  maxWorkers: number,
  resetCache: boolean,
};

module.exports = function createHasteMap(
  config: Config,
  options?: ?Options,
): HasteMap {
  const ignorePattern = new RegExp(
    [config.cacheDirectory].concat(config.modulePathIgnorePatterns).join('|')
  );

  return new HasteMap({
    cacheDirectory: config.cacheDirectory,
    extensions: [SNAPSHOT_EXTENSION].concat(config.moduleFileExtensions),
    ignorePattern,
    maxWorkers: options && options.maxWorkers,
    mocksPattern: config.mocksPattern,
    name: config.name,
    platforms: config.haste.platforms || ['ios', 'android'],
    providesModuleNodeModules: config.haste.providesModuleNodeModules,
    resetCache: options && options.resetCache,
    roots: config.testPathDirs,
    useWatchman: config.watchman,
  });
};
