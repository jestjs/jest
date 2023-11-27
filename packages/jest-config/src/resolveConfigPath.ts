/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import chalk = require('chalk');
import * as fs from 'graceful-fs';
import slash = require('slash');
import {ValidationError} from 'jest-validate';
import {
  JEST_CONFIG_BASE_NAME,
  JEST_CONFIG_EXT_ORDER,
  PACKAGE_JSON,
} from './constants';
import {BULLET, DOCUMENTATION_NOTE} from './utils';

const isFile = (filePath: string) =>
  fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory();

const getConfigFilename = (ext: string) => JEST_CONFIG_BASE_NAME + ext;

export default function resolveConfigPath(
  pathToResolve: string,
  cwd: string,
  skipMultipleConfigError = false,
): string {
  if (!path.isAbsolute(cwd)) {
    throw new Error(`"cwd" must be an absolute path. cwd: ${cwd}`);
  }
  const absolutePath = path.isAbsolute(pathToResolve)
    ? pathToResolve
    : path.resolve(cwd, pathToResolve);

  if (isFile(absolutePath)) {
    return absolutePath;
  }

  // This is a guard against passing non existing path as a project/config,
  // that will otherwise result in a very confusing situation.
  // e.g.
  // With a directory structure like this:
  //   my_project/
  //     package.json
  //
  // Passing a `my_project/some_directory_that_doesnt_exist` as a project
  // name will resolve into a (possibly empty) `my_project/package.json` and
  // try to run all tests it finds under `my_project` directory.
  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      "Can't find a root directory while resolving a config file path.\n" +
        `Provided path to resolve: ${pathToResolve}\n` +
        `cwd: ${cwd}`,
    );
  }

  return resolveConfigPathByTraversing(
    absolutePath,
    pathToResolve,
    cwd,
    skipMultipleConfigError,
  );
}

const resolveConfigPathByTraversing = (
  pathToResolve: string,
  initialPath: string,
  cwd: string,
  skipMultipleConfigError: boolean,
): string => {
  const configFiles = JEST_CONFIG_EXT_ORDER.map(ext =>
    path.resolve(pathToResolve, getConfigFilename(ext)),
  ).filter(isFile);

  const packageJson = findPackageJson(pathToResolve);

  if (packageJson) {
    const jestKey = getPackageJsonJestKey(packageJson);

    if (jestKey) {
      if (typeof jestKey === 'string') {
        const absolutePath = path.isAbsolute(jestKey)
          ? jestKey
          : path.resolve(pathToResolve, jestKey);

        if (!isFile(absolutePath)) {
          throw new ValidationError(
            `${BULLET}Validation Error`,
            `  Configuration in ${chalk.bold(packageJson)} is not valid. ` +
              `Jest expects the string configuration to point to a file, but ${absolutePath} is not. ` +
              `Please check your Jest configuration in ${chalk.bold(
                packageJson,
              )}.`,
            DOCUMENTATION_NOTE,
          );
        }

        configFiles.push(absolutePath);
      } else {
        configFiles.push(packageJson);
      }
    }
  }

  if (!skipMultipleConfigError && configFiles.length > 1) {
    throw new ValidationError(...makeMultipleConfigsErrorMessage(configFiles));
  }

  if (configFiles.length > 0 || packageJson) {
    return configFiles[0] ?? packageJson;
  }

  // This is the system root.
  // We tried everything, config is nowhere to be found ¯\_(ツ)_/¯
  if (pathToResolve === path.dirname(pathToResolve)) {
    throw new Error(makeResolutionErrorMessage(initialPath, cwd));
  }

  // go up a level and try it again
  return resolveConfigPathByTraversing(
    path.dirname(pathToResolve),
    initialPath,
    cwd,
    skipMultipleConfigError,
  );
};

const findPackageJson = (pathToResolve: string) => {
  const packagePath = path.resolve(pathToResolve, PACKAGE_JSON);
  if (isFile(packagePath)) {
    return packagePath;
  }

  return undefined;
};

const getPackageJsonJestKey = (
  packagePath: string,
): Record<string, unknown> | string | undefined => {
  try {
    const content = fs.readFileSync(packagePath, 'utf8');
    const parsedContent = JSON.parse(content);

    if ('jest' in parsedContent) {
      return parsedContent.jest;
    }
  } catch {}
  return undefined;
};

const makeResolutionErrorMessage = (initialPath: string, cwd: string) =>
  'Could not find a config file based on provided values:\n' +
  `path: "${initialPath}"\n` +
  `cwd: "${cwd}"\n` +
  'Config paths must be specified by either a direct path to a config\n' +
  'file, or a path to a directory. If directory is given, Jest will try to\n' +
  `traverse directory tree up, until it finds one of those files in exact order: ${JEST_CONFIG_EXT_ORDER.map(
    ext => `"${getConfigFilename(ext)}"`,
  ).join(' or ')}.`;

function extraIfPackageJson(configPath: string) {
  if (configPath.endsWith(PACKAGE_JSON)) {
    return '`jest` key in ';
  }

  return '';
}

const makeMultipleConfigsErrorMessage = (
  configPaths: Array<string>,
): [string, string, string] => [
  `${BULLET}${chalk.bold('Multiple configurations found')}`,
  [
    ...configPaths.map(
      configPath =>
        `    * ${extraIfPackageJson(configPath)}${slash(configPath)}`,
    ),
    '',
    '  Implicit config resolution does not allow multiple configuration files.',
    '  Either remove unused config files or select one explicitly with `--config`.',
  ].join('\n'),
  DOCUMENTATION_NOTE,
];
