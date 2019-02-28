/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import {Config} from '@jest/types';
import {ValidationError} from 'jest-validate';
import Resolver from 'jest-resolve';
import chalk from 'chalk';

type ResolveOptions = {
  rootDir: Config.Path;
  key: string;
  filePath: Config.Path;
  optional?: boolean;
};

export const BULLET: string = chalk.bold('\u25cf ');
export const DOCUMENTATION_NOTE = `  ${chalk.bold(
  'Configuration Documentation:',
)}
  https://jestjs.io/docs/configuration.html
`;

const createValidationError = (message: string) =>
  new ValidationError(`${BULLET}Validation Error`, message, DOCUMENTATION_NOTE);

export const resolve = (
  resolver: string | null | undefined,
  {key, filePath, rootDir, optional}: ResolveOptions,
) => {
  const module = Resolver.findNodeModule(
    replaceRootDirInPath(rootDir, filePath),
    {
      basedir: rootDir,
      resolver: resolver || undefined,
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

export const escapeGlobCharacters = (path: Config.Path): Config.Glob =>
  path.replace(/([()*{}\[\]!?\\])/g, '\\$1');

export const replaceRootDirInPath = (
  rootDir: Config.Path,
  filePath: Config.Path,
): string => {
  if (!/^<rootDir>/.test(filePath)) {
    return filePath;
  }

  return path.resolve(
    rootDir,
    path.normalize('./' + filePath.substr('<rootDir>'.length)),
  );
};

// TODO: Type as returning same type as input
const _replaceRootDirInObject = (
  rootDir: Config.Path,
  config: any,
): {[key: string]: unknown} => {
  if (config !== null) {
    const newConfig: {[key: string]: unknown} = {};
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

// TODO: Type as returning same type as input
export const _replaceRootDirTags = (rootDir: Config.Path, config: any): any => {
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

export const resolveWithPrefix = (
  resolver: string | undefined | null,
  {
    filePath,
    humanOptionName,
    optionName,
    prefix,
    rootDir,
  }: {
    filePath: string;
    humanOptionName: string;
    optionName: string;
    prefix: string;
    rootDir: Config.Path;
  },
) => {
  const fileName = replaceRootDirInPath(rootDir, filePath);
  let module = Resolver.findNodeModule(`${prefix}${fileName}`, {
    basedir: rootDir,
    resolver: resolver || undefined,
  });
  if (module) {
    return module;
  }

  try {
    return require.resolve(`${prefix}${fileName}`);
  } catch (e) {}

  module = Resolver.findNodeModule(fileName, {
    basedir: rootDir,
    resolver: resolver || undefined,
  });
  if (module) {
    return module;
  }

  try {
    return require.resolve(fileName);
  } catch (e) {}

  throw createValidationError(
    `  ${humanOptionName} ${chalk.bold(
      fileName,
    )} cannot be found. Make sure the ${chalk.bold(
      optionName,
    )} configuration option points to an existing node module.`,
  );
};

/**
 * Finds the test environment to use:
 *
 * 1. looks for jest-environment-<name> relative to project.
 * 1. looks for jest-environment-<name> relative to Jest.
 * 1. looks for <name> relative to project.
 * 1. looks for <name> relative to Jest.
 */
export const getTestEnvironment = ({
  rootDir,
  testEnvironment: filePath,
}: {
  rootDir: Config.Path;
  testEnvironment: string;
}) =>
  resolveWithPrefix(undefined, {
    filePath,
    humanOptionName: 'Test environment',
    optionName: 'testEnvironment',
    prefix: 'jest-environment-',
    rootDir,
  });

/**
 * Finds the watch plugins to use:
 *
 * 1. looks for jest-watch-<name> relative to project.
 * 1. looks for jest-watch-<name> relative to Jest.
 * 1. looks for <name> relative to project.
 * 1. looks for <name> relative to Jest.
 */
export const getWatchPlugin = (
  resolver: string | undefined | null,
  {filePath, rootDir}: {filePath: string; rootDir: Config.Path},
) =>
  resolveWithPrefix(resolver, {
    filePath,
    humanOptionName: 'Watch plugin',
    optionName: 'watchPlugins',
    prefix: 'jest-watch-',
    rootDir,
  });

/**
 * Finds the runner to use:
 *
 * 1. looks for jest-runner-<name> relative to project.
 * 1. looks for jest-runner-<name> relative to Jest.
 * 1. looks for <name> relative to project.
 * 1. looks for <name> relative to Jest.
 */
export const getRunner = (
  resolver: string | undefined | null,
  {filePath, rootDir}: {filePath: string; rootDir: Config.Path},
) =>
  resolveWithPrefix(resolver, {
    filePath,
    humanOptionName: 'Jest Runner',
    optionName: 'runner',
    prefix: 'jest-runner-',
    rootDir,
  });

export const isJSONString = (text?: string) =>
  text &&
  typeof text === 'string' &&
  text.startsWith('{') &&
  text.endsWith('}');
