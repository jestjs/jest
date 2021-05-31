/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import chalk = require('chalk');
import type {Config} from '@jest/types';
import {ValidationError} from 'jest-validate';
import Resolver from './resolver';

const BULLET: string = chalk.bold('\u25cf ');
const DOCUMENTATION_NOTE = `  ${chalk.bold('Configuration Documentation:')}
  https://jestjs.io/docs/configuration
`;

const createValidationError = (message: string) =>
  new ValidationError(`${BULLET}Validation Error`, message, DOCUMENTATION_NOTE);

const replaceRootDirInPath = (
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

const resolveWithPrefix = (
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
): string => {
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
  } catch {}

  module = Resolver.findNodeModule(fileName, {
    basedir: rootDir,
    resolver: resolver || undefined,
  });
  if (module) {
    return module;
  }

  try {
    return require.resolve(fileName);
  } catch {}

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
export const resolveTestEnvironment = ({
  rootDir,
  testEnvironment: filePath,
}: {
  rootDir: Config.Path;
  testEnvironment: string;
}): string =>
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
export const resolveWatchPlugin = (
  resolver: string | undefined | null,
  {filePath, rootDir}: {filePath: string; rootDir: Config.Path},
): string =>
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
export const resolveRunner = (
  resolver: string | undefined | null,
  {filePath, rootDir}: {filePath: string; rootDir: Config.Path},
): string =>
  resolveWithPrefix(resolver, {
    filePath,
    humanOptionName: 'Jest Runner',
    optionName: 'runner',
    prefix: 'jest-runner-',
    rootDir,
  });

export const resolveSequencer = (
  resolver: string | undefined | null,
  {filePath, rootDir}: {filePath: string; rootDir: Config.Path},
): string =>
  resolveWithPrefix(resolver, {
    filePath,
    humanOptionName: 'Jest Sequencer',
    optionName: 'testSequencer',
    prefix: 'jest-sequencer-',
    rootDir,
  });
