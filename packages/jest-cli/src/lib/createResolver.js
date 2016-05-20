/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const Resolver = require('jest-resolve');

const getModuleNameMapper = config => {
  if (config.moduleNameMapper.length) {
    const moduleNameMapper = Object.create(null);
    config.moduleNameMapper.forEach(
      map => moduleNameMapper[map[1]] = new RegExp(map[0])
    );
    return moduleNameMapper;
  }
  return null;
};

module.exports = function createResolver(config, moduleMap) {
  return new Resolver(moduleMap, {
    defaultPlatform: config.haste.defaultPlatform,
    extensions: config.moduleFileExtensions.map(extension => '.' + extension),
    hasCoreModules: true,
    moduleDirectories: config.moduleDirectories,
    moduleNameMapper: getModuleNameMapper(config),
    modulePaths: config.modulePaths,
    platforms: config.haste.platforms,
  });
};
