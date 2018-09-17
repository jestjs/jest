/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Path, Glob} from 'types/Config';

import path from 'path';
import {ValidationError} from 'jest-validate';
import Resolver from 'jest-resolve';
import chalk from 'chalk';

type ResolveOptions = {|
  rootDir: string,
  key: string,
  filePath: Path,
  optional?: boolean,
|};

export const BULLET: string = chalk.bold('\u25cf ');
export const DOCUMENTATION_NOTE = `  ${chalk.bold(
  'Configuration Documentation:',
)}
  https://jestjs.io/docs/configuration.html
`;

const createValidationError = (message: string) =>
  new ValidationError(`${BULLET}Validation Error`, message, DOCUMENTATION_NOTE);

export const resolve = (
  resolver: ?string,
  {key, filePath, rootDir, optional}: ResolveOptions,
) => {
  const module = Resolver.findNodeModule(
    replaceRootDirInPath(rootDir, filePath),
    {
      basedir: rootDir,
      resolver,
    },
  );

  if (!module && !optional) {
    throw createValidationError(
      `  Module ${chalk.bold(filePath)} in the ${chalk.bold(
        key,
      )} option was not found.
         ${chalk.bold('<rootDir>')} is: ${rootDir}`,
    );
  }

  return module;
};

export const escapeGlobCharacters = (path: Path): Glob =>
  path.replace(/([()*{}\[\]!?\\])/g, '\\$1');

export const replaceRootDirInPath = (
  rootDir: string,
  filePath: Path,
): string => {
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
      newConfig[configKey] =
        configKey === 'rootDir'
          ? config[configKey]
          : _replaceRootDirTags(rootDir, config[configKey]);
    }
    return newConfig;
  }
  return config;
};

export const _replaceRootDirTags = (rootDir: string, config: any) => {
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
      return replaceRootDirInPath(rootDir, config);
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
export const getTestEnvironment = (config: Object) => {
  const env = replaceRootDirInPath(config.rootDir, config.testEnvironment);
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

  throw createValidationError(
    `  Test environment ${chalk.bold(
      env,
    )} cannot be found. Make sure the ${chalk.bold(
      'testEnvironment',
    )} configuration option points to an existing node module.`,
  );
};

export const isJSONString = (text: ?string) =>
  text &&
  typeof text === 'string' &&
  text.startsWith('{') &&
  text.endsWith('}');
