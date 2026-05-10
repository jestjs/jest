/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import chalk from 'chalk';
import {ValidationError} from 'jest-validate';
import Resolver from './resolver';

const BULLET: string = chalk.bold('\u25CF ');
const DOCUMENTATION_NOTE = `  ${chalk.bold('Configuration Documentation:')}
  https://jestjs.io/docs/configuration
`;

const createValidationError = (message: string) =>
  new ValidationError(`${BULLET}Validation Error`, message, DOCUMENTATION_NOTE);

const replaceRootDirInPath = (rootDir: string, filePath: string): string => {
  if (!filePath.startsWith('<rootDir>')) {
    return filePath;
  }

  return path.resolve(
    rootDir,
    path.normalize(`./${filePath.slice('<rootDir>'.length)}`),
  );
};

const resolveWithPrefix = (
  resolver: string | undefined | null,
  {
    filePath,
    humanOptionName,
    optionName,
    prefix,
    requireResolveFunction,
    rootDir,
  }: {
    filePath: string;
    humanOptionName: string;
    optionName: string;
    prefix: string;
    requireResolveFunction: (moduleName: string) => string;
    rootDir: string;
  },
): string => {
  const fileName = replaceRootDirInPath(rootDir, filePath);
  const isPathLike = fileName.startsWith('.') || path.isAbsolute(fileName);

  // For path-like inputs (relative or absolute paths), resolve from rootDir
  // first since they refer to project-local files, not npm packages.
  // For package names, resolve from Jest's own location first to avoid
  // loading wrong versions hoisted by third-party dependencies.
  // See https://github.com/jestjs/jest/issues/5913
  if (isPathLike) {
    // For path-like inputs, prefix variants (e.g. jest-environment-./foo) are
    // nonsensical, so only resolve the bare name from rootDir first, then
    // fall back to requireResolveFunction.
    const module = Resolver.findNodeModule(fileName, {
      basedir: rootDir,
      resolver: resolver || undefined,
    });
    if (module) {
      return module;
    }

    try {
      return requireResolveFunction(fileName);
    } catch {}
  } else {
    try {
      return requireResolveFunction(`${prefix}${fileName}`);
    } catch {}

    let module = Resolver.findNodeModule(`${prefix}${fileName}`, {
      basedir: rootDir,
      resolver: resolver || undefined,
    });
    if (module) {
      return module;
    }

    try {
      return requireResolveFunction(fileName);
    } catch {}

    module = Resolver.findNodeModule(fileName, {
      basedir: rootDir,
      resolver: resolver || undefined,
    });
    if (module) {
      return module;
    }
  }

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
 * 1. looks for jest-environment-<name> relative to Jest.
 * 1. looks for jest-environment-<name> relative to project.
 * 1. looks for <name> relative to Jest.
 * 1. looks for <name> relative to project.
 */
export const resolveTestEnvironment = ({
  rootDir,
  testEnvironment: filePath,
  requireResolveFunction,
}: {
  rootDir: string;
  testEnvironment: string;
  requireResolveFunction: (moduleName: string) => string;
}): string => {
  // we don't want to resolve the actual `jsdom` module if `jest-environment-jsdom` is not installed, but `jsdom` package is
  if (filePath === 'jsdom') {
    filePath = 'jest-environment-jsdom';
  }

  try {
    return resolveWithPrefix(undefined, {
      filePath,
      humanOptionName: 'Test environment',
      optionName: 'testEnvironment',
      prefix: 'jest-environment-',
      requireResolveFunction,
      rootDir,
    });
  } catch (error: any) {
    if (filePath === 'jest-environment-jsdom') {
      error.message +=
        '\n\nAs of Jest 28 "jest-environment-jsdom" is no longer shipped by default, make sure to install it separately.';
    }

    throw error;
  }
};

/**
 * Finds the watch plugins to use:
 *
 * For package names:
 * 1. looks for jest-watch-<name> relative to Jest.
 * 1. looks for jest-watch-<name> relative to project.
 * 1. looks for <name> relative to Jest.
 * 1. looks for <name> relative to project.
 *
 * For file paths (relative/absolute):
 * 1. looks for jest-watch-<name> relative to project.
 * 1. looks for <name> relative to project.
 */
export const resolveWatchPlugin = (
  resolver: string | undefined | null,
  {
    filePath,
    rootDir,
    requireResolveFunction,
  }: {
    filePath: string;
    rootDir: string;
    requireResolveFunction: (moduleName: string) => string;
  },
): string =>
  resolveWithPrefix(resolver, {
    filePath,
    humanOptionName: 'Watch plugin',
    optionName: 'watchPlugins',
    prefix: 'jest-watch-',
    requireResolveFunction,
    rootDir,
  });

/**
 * Finds the runner to use:
 *
 * For package names:
 * 1. looks for jest-runner-<name> relative to Jest.
 * 1. looks for jest-runner-<name> relative to project.
 * 1. looks for <name> relative to Jest.
 * 1. looks for <name> relative to project.
 *
 * For file paths (relative/absolute):
 * 1. looks for jest-runner-<name> relative to project.
 * 1. looks for <name> relative to project.
 */
export const resolveRunner = (
  resolver: string | undefined | null,
  {
    filePath,
    rootDir,
    requireResolveFunction,
  }: {
    filePath: string;
    rootDir: string;
    requireResolveFunction: (moduleName: string) => string;
  },
): string =>
  resolveWithPrefix(resolver, {
    filePath,
    humanOptionName: 'Jest Runner',
    optionName: 'runner',
    prefix: 'jest-runner-',
    requireResolveFunction,
    rootDir,
  });

export const resolveSequencer = (
  resolver: string | undefined | null,
  {
    filePath,
    rootDir,
    requireResolveFunction,
  }: {
    filePath: string;
    rootDir: string;
    requireResolveFunction: (moduleName: string) => string;
  },
): string =>
  resolveWithPrefix(resolver, {
    filePath,
    humanOptionName: 'Jest Sequencer',
    optionName: 'testSequencer',
    prefix: 'jest-sequencer-',
    requireResolveFunction,
    rootDir,
  });
