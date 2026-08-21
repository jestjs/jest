/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import chalk from 'chalk';
import type {CosmiconfigResult, Loader, PublicExplorer} from 'cosmiconfig';
import * as fs from 'graceful-fs';
import slash from 'slash';
import {ValidationError} from 'jest-validate';
import {JEST_CONFIG_SEARCH_PLACES, PACKAGE_JSON} from './constants';
import createConfigExplorer from './createConfigExplorer';
import {BULLET, DOCUMENTATION_NOTE} from './utils';

const CONFIG_FOUND = Symbol('CONFIG_FOUND');
const PACKAGE_JSON_BOUNDARY = Symbol('PACKAGE_JSON_BOUNDARY');

const isFile = (filePath: string) =>
  fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory();

const discoveryLoader: Loader = () => CONFIG_FOUND;
const packageJsonDiscoveryLoader: Loader = (filepath, content) => {
  if (path.basename(filepath) !== PACKAGE_JSON) {
    return CONFIG_FOUND;
  }

  try {
    const packageJson = JSON.parse(content);
    return {
      jest:
        typeof packageJson.jest === 'string' && packageJson.jest
          ? packageJson.jest
          : packageJson.jest
            ? CONFIG_FOUND
            : PACKAGE_JSON_BOUNDARY,
    };
  } catch {
    return {jest: PACKAGE_JSON_BOUNDARY};
  }
};

const discoveryLoaders = {
  '.cjs': discoveryLoader,
  '.cts': discoveryLoader,
  '.js': discoveryLoader,
  '.json': packageJsonDiscoveryLoader,
  '.mjs': discoveryLoader,
  '.mts': discoveryLoader,
  '.ts': discoveryLoader,
  '.yaml': discoveryLoader,
  '.yml': discoveryLoader,
  noExt: discoveryLoader,
};

export default async function resolveConfigPath(
  pathToResolve: string,
  cwd: string,
  skipMultipleConfigError = false,
): Promise<string> {
  if (!path.isAbsolute(cwd)) {
    throw new Error(`"cwd" must be an absolute path. cwd: ${cwd}`);
  }
  const absolutePath = path.isAbsolute(pathToResolve)
    ? pathToResolve
    : path.resolve(cwd, pathToResolve);

  if (isFile(absolutePath)) {
    if (path.basename(absolutePath).toLowerCase() === PACKAGE_JSON) {
      const jestKey = getPackageJsonJestKey(absolutePath);
      if (typeof jestKey === 'string' && jestKey) {
        const packageConfigPath = path.isAbsolute(jestKey)
          ? jestKey
          : path.resolve(path.dirname(absolutePath), jestKey);

        if (!isFile(packageConfigPath)) {
          throwInvalidPackageConfig(absolutePath, packageConfigPath);
        }
        return packageConfigPath;
      }
    }
    return absolutePath;
  }

  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      "Can't find a root directory while resolving a config file path.\n" +
        `Provided path to resolve: ${pathToResolve}\n` +
        `cwd: ${cwd}`,
    );
  }

  const explorer = createConfigExplorer(
    [...JEST_CONFIG_SEARCH_PLACES],
    discoveryLoaders,
    false,
  );
  const result = await searchForConfig(explorer, absolutePath);

  if (!result) {
    throw new Error(makeResolutionErrorMessage(pathToResolve, cwd));
  }

  const configDirectory = findConfigDirectory(absolutePath, result.filepath);
  const configFiles = getConfigFiles(configDirectory);
  const packageJson = path.resolve(configDirectory, PACKAGE_JSON);
  const jestKey = isFile(packageJson)
    ? getPackageJsonJestKey(packageJson)
    : undefined;

  if (jestKey) {
    if (typeof jestKey === 'string') {
      const packageConfigPath = path.isAbsolute(jestKey)
        ? jestKey
        : path.resolve(configDirectory, jestKey);

      if (!isFile(packageConfigPath)) {
        throwInvalidPackageConfig(packageJson, packageConfigPath);
      }
      if (!configFiles.includes(packageConfigPath)) {
        configFiles.push(packageConfigPath);
      }
    } else {
      configFiles.push(packageJson);
    }
  }

  if (!skipMultipleConfigError && configFiles.length > 1) {
    throw new ValidationError(...makeMultipleConfigsErrorMessage(configFiles));
  }

  if (configFiles.length > 0) {
    return configFiles[0];
  }

  if (typeof result.config === 'string') {
    return path.isAbsolute(result.config)
      ? result.config
      : path.resolve(configDirectory, result.config);
  }

  if (result.config === PACKAGE_JSON_BOUNDARY) {
    return packageJson;
  }

  return result.filepath;
}

const searchForConfig = async (
  explorer: Pick<PublicExplorer, 'search'>,
  startDirectory: string,
): Promise<CosmiconfigResult> => {
  let currentDirectory = startDirectory;

  while (true) {
    const result = await explorer.search(currentDirectory);
    if (result) {
      return result;
    }

    const unreadableConfig = getConfigFiles(currentDirectory)[0];
    if (unreadableConfig) {
      return {config: CONFIG_FOUND, filepath: unreadableConfig};
    }

    const packageJson = path.resolve(currentDirectory, PACKAGE_JSON);
    if (isFile(packageJson)) {
      return {config: PACKAGE_JSON_BOUNDARY, filepath: packageJson};
    }

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      return null;
    }
    currentDirectory = parentDirectory;
  }
};

const findConfigDirectory = (startDirectory: string, configPath: string) => {
  let currentDirectory = startDirectory;

  while (true) {
    if (
      JEST_CONFIG_SEARCH_PLACES.some(
        place => path.resolve(currentDirectory, place) === configPath,
      )
    ) {
      return currentDirectory;
    }

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      return path.dirname(configPath);
    }
    currentDirectory = parentDirectory;
  }
};

const getConfigFiles = (directory: string) =>
  JEST_CONFIG_SEARCH_PLACES.filter(place => place !== PACKAGE_JSON)
    .map(place => path.resolve(directory, place))
    .filter(isFile);

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

const throwInvalidPackageConfig = (
  packageJson: string,
  packageConfigPath: string,
): never => {
  throw new ValidationError(
    `${BULLET}Validation Error`,
    `  Configuration in ${chalk.bold(packageJson)} is not valid. ` +
      `Jest expects the string configuration to point to a file, but ${packageConfigPath} is not. ` +
      `Please check your Jest configuration in ${chalk.bold(packageJson)}.`,
    DOCUMENTATION_NOTE,
  );
};

const makeResolutionErrorMessage = (initialPath: string, cwd: string) =>
  'Could not find a config file based on provided values:\n' +
  `path: "${initialPath}"\n` +
  `cwd: "${cwd}"\n` +
  'Config paths must be specified by either a direct path to a config\n' +
  'file, or a path to a directory. If directory is given, Jest will try to\n' +
  `traverse directory tree up, until it finds one of those files in exact order: ${JEST_CONFIG_SEARCH_PLACES.map(
    place => `"${place}"`,
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
