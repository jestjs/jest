/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import type {Service} from 'ts-node';
import type {Config} from '@jest/types';
import {interopRequireDefault, requireOrImportModule} from 'jest-util';
import {
  JEST_CONFIG_EXT_JSON,
  JEST_CONFIG_EXT_TS,
  PACKAGE_JSON,
} from './constants';
// @ts-expect-error: vendored
import jsonlint from './vendor/jsonlint';

// Read the configuration and set its `rootDir`
// 1. If it's a `package.json` file, we look into its "jest" property
// 2. If it's a `jest.config.ts` file, we use `ts-node` to transpile & require it
// 3. For any other file, we just require it. If we receive an 'ERR_REQUIRE_ESM'
//    from node, perform a dynamic import instead.
export default async function readConfigFileAndSetRootDir(
  configPath: Config.Path,
): Promise<Config.InitialOptions> {
  const isTS = configPath.endsWith(JEST_CONFIG_EXT_TS);
  const isJSON = configPath.endsWith(JEST_CONFIG_EXT_JSON);
  let configObject;

  try {
    if (isTS) {
      configObject = await loadTSConfigFile(configPath);
    } else {
      configObject = await requireOrImportModule<any>(configPath);
    }
  } catch (error) {
    if (isJSON) {
      throw new Error(
        `Jest: Failed to parse config file ${configPath}\n` +
          `  ${jsonlint.errors(fs.readFileSync(configPath, 'utf8'))}`,
      );
    } else if (isTS) {
      throw new Error(
        `Jest: Failed to parse the TypeScript config file ${configPath}\n` +
          `  ${error}`,
      );
    } else {
      throw error;
    }
  }

  if (configPath.endsWith(PACKAGE_JSON)) {
    // Event if there's no "jest" property in package.json we will still use
    // an empty object.
    configObject = configObject.jest || {};
  }

  if (typeof configObject === 'function') {
    configObject = await configObject();
  }

  if (configObject.rootDir) {
    // We don't touch it if it has an absolute path specified
    if (!path.isAbsolute(configObject.rootDir)) {
      // otherwise, we'll resolve it relative to the file's __dirname
      configObject.rootDir = path.resolve(
        path.dirname(configPath),
        configObject.rootDir,
      );
    }
  } else {
    // If rootDir is not there, we'll set it to this file's __dirname
    configObject.rootDir = path.dirname(configPath);
  }

  return configObject;
}

// Load the TypeScript configuration
const loadTSConfigFile = async (
  configPath: Config.Path,
): Promise<Config.InitialOptions> => {
  let registerer: Service;

  // Register TypeScript compiler instance
  try {
    registerer = require('ts-node').register({
      compilerOptions: {
        module: 'CommonJS',
      },
    });
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        `Jest: 'ts-node' is required for the TypeScript configuration files. Make sure it is installed\nError: ${e.message}`,
      );
    }

    throw e;
  }

  registerer.enabled(true);

  let configObject = interopRequireDefault(require(configPath)).default;

  // In case the config is a function which imports more Typescript code
  if (typeof configObject === 'function') {
    configObject = await configObject();
  }

  registerer.enabled(false);

  return configObject;
};
