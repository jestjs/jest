/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

import type {Config, Path} from 'types/Config';

const Resolver = require('jest-resolve');
const path = require('path');

const resolve = (rootDir: string, key: string, filePath: Path) => {
  const module = Resolver.findNodeModule(
    _replaceRootDirTags(rootDir, filePath),
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

const _replaceRootDirTags = (rootDir: string, config: Config) => {
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
          newConfig[configKey] =
            configKey === 'rootDir'
              ? config[configKey]
              : _replaceRootDirTags(rootDir, config[configKey]);
        }
        return newConfig;
      }
      break;
    case 'string':
      if (!/^<rootDir>/.test(config)) {
        return config;
      }

      return path.resolve(
        rootDir,
        path.normalize('./' + config.substr('<rootDir>'.length)),
      );
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
const getTestEnvironment = (config: Config) => {
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
  _replaceRootDirTags,
  getTestEnvironment,
  resolve,
};
