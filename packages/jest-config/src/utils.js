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

import type {Path} from 'types/Config';

const Resolver = require('jest-resolve');
const path = require('path');

const resolve = (rootDir: string, key: string, filePath: Path) => {
  const module = Resolver.findNodeModule(
    _replaceRootDirInPath(rootDir, filePath),
    {
      basedir: rootDir,
    },
  );

  if (!module) {
    throw new Error(
      `Jest: Module "${filePath}" in the "${key}" option was not found.`
    );
  }

  return module;
};

const _replaceRootDirInPath = (rootDir: string, filePath: Path): string => {
  if (!/^<rootDir>/.test(filePath)) {
    return filePath;
  }

  return path.resolve(
    rootDir,
    path.normalize('./' + filePath.substr('<rootDir>'.length)),
  );
};

const _replaceRootDirTags = (rootDir: string, config: any) => {
  switch (typeof config) {
    case 'object':
      if (config instanceof RegExp) {
        return config;
      }

      if (Array.isArray(config)) {
        return config.map(item => _replaceRootDirTags(rootDir, item));
      }

      if (config !== null) {
        const newConfig = {};
        for (const configKey in config) {
          newConfig[configKey] = configKey === 'rootDir'
            ? config[configKey]
            : _replaceRootDirTags(rootDir, config[configKey]);
        }
        return newConfig;
      }
      break;
    case 'string':
      return _replaceRootDirInPath(rootDir, config);
  }
  return config;
};

/**
 * Finds the test environment to use:
 *
 * 1. looks for jest-environment-<name> relative to project.
 * 1. looks for jest-environment-<name> relative to Jest.
 * 1. looks for <name> relative to project.
 * 1. looks for <name> relative to Jest.
 */
const getTestEnvironment = (config: Object) => {
  const env = config.testEnvironment;
  let module = Resolver.findNodeModule(`jest-environment-${env}`, {
    basedir: config.rootDir,
  });
  if (module) {
    return module;
  }

  try {
    return require.resolve(`jest-environment-${env}`);
  } catch (e) {}

  module = Resolver.findNodeModule(env, {basedir: config.rootDir});
  if (module) {
    return module;
  }

  try {
    return require.resolve(env);
  } catch (e) {}

  throw new Error(
    `Jest: test environment "${env}" cannot be found. Make sure the ` +
    `"testEnvironment" configuration option points to an existing node module.`,
  );
};

module.exports = {
  _replaceRootDirInPath,
  _replaceRootDirTags,
  getTestEnvironment,
  resolve,
};
