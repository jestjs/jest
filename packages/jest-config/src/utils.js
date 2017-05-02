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

const {ValidationError} = require('jest-validate');
const Resolver = require('jest-resolve');
const path = require('path');
const chalk = require('chalk');
const BULLET: string = chalk.bold('\u25cf ');
const DOCUMENTATION_NOTE = `  ${chalk.bold('Configuration Documentation:')}
  https://facebook.github.io/jest/docs/configuration.html
`;

const createValidationError = (message: string) => {
  return new ValidationError(
    `${BULLET}Validation Error`,
    message,
    DOCUMENTATION_NOTE,
  );
};

const resolve = (rootDir: string, key: string, filePath: Path) => {
  const module = Resolver.findNodeModule(
    _replaceRootDirInPath(rootDir, filePath),
    {
      basedir: rootDir,
    },
  );

  if (!module) {
    /* eslint-disable max-len */
    throw createValidationError(
      `  Module ${chalk.bold(filePath)} in the ${chalk.bold(key)} option was not found.`,
    );
    /* eslint-disable max-len */
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

const _replaceRootDirInObject = (rootDir: string, config: any): Object => {
  if (config !== null) {
    const newConfig = {};
    for (const configKey in config) {
      newConfig[configKey] = configKey === 'rootDir'
        ? config[configKey]
        : _replaceRootDirTags(rootDir, config[configKey]);
    }
    return newConfig;
  }
  return config;
};

const _replaceRootDirTags = (rootDir: string, config: any) => {
  switch (typeof config) {
    case 'object':
      if (Array.isArray(config)) {
        return config.map(item => _replaceRootDirTags(rootDir, item));
      }
      if (config instanceof RegExp) {
        return config;
      }
      return _replaceRootDirInObject(rootDir, config);
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

  /* eslint-disable max-len */
  throw createValidationError(
    `  Test environment ${chalk.bold(env)} cannot be found. Make sure the ${chalk.bold('testEnvironment')} configuration option points to an existing node module.`,
  );
  /* eslint-disable max-len */
};

const isJSONString = (text: ?string) =>
  text &&
  typeof text === 'string' &&
  text.startsWith('{') &&
  text.endsWith('}');

module.exports = {
  BULLET,
  DOCUMENTATION_NOTE,
  _replaceRootDirInObject,
  _replaceRootDirInPath,
  _replaceRootDirTags,
  getTestEnvironment,
  isJSONString,
  resolve,
};
