/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {isNativeError} from 'util/types';
import * as fs from 'graceful-fs';
import parseJson = require('parse-json');
import stripJsonComments = require('strip-json-comments');
import type {Config} from '@jest/types';
import {extract, parse} from 'jest-docblock';
import {interopRequireDefault, requireOrImportModule} from 'jest-util';
import {
  JEST_CONFIG_EXT_CTS,
  JEST_CONFIG_EXT_JSON,
  JEST_CONFIG_EXT_TS,
  PACKAGE_JSON,
} from './constants';

interface TsLoader {
  enabled: (bool: boolean) => void;
}
type TsLoaderModule = 'ts-node' | 'esbuild-register';
// Read the configuration and set its `rootDir`
// 1. If it's a `package.json` file, we look into its "jest" property
// 2. If it's a `jest.config.ts` file, we use `ts-node` to transpile & require it
// 3. For any other file, we just require it. If we receive an 'ERR_REQUIRE_ESM'
//    from node, perform a dynamic import instead.
export default async function readConfigFileAndSetRootDir(
  configPath: string,
): Promise<Config.InitialOptions> {
  const isTS =
    configPath.endsWith(JEST_CONFIG_EXT_TS) ||
    configPath.endsWith(JEST_CONFIG_EXT_CTS);
  const isJSON = configPath.endsWith(JEST_CONFIG_EXT_JSON);
  let configObject;

  try {
    if (isTS) {
      configObject = await loadTSConfigFile(configPath);
    } else if (isJSON) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      configObject = parseJson(stripJsonComments(fileContent), configPath);
    } else {
      configObject = await requireOrImportModule<any>(configPath);
    }
  } catch (error) {
    if (isTS) {
      throw new Error(
        `Jest: Failed to parse the TypeScript config file ${configPath}\n` +
          `  ${error}`,
      );
    }

    throw error;
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
      configObject = {
        ...configObject,
        rootDir: path.resolve(path.dirname(configPath), configObject.rootDir),
      };
    }
  } else {
    // If rootDir is not there, we'll set it to this file's __dirname
    configObject = {
      ...configObject,
      rootDir: path.dirname(configPath),
    };
  }

  return configObject;
}

// Load the TypeScript configuration
let extraTSLoaderOptions: Record<string, unknown>;

const loadTSConfigFile = async (
  configPath: string,
): Promise<Config.InitialOptions> => {
  // Get registered TypeScript compiler instance
  const docblockPragmas = parse(extract(fs.readFileSync(configPath, 'utf8')));
  const tsLoader = docblockPragmas['jest-config-loader'];
  const docblockTSLoaderOptions = docblockPragmas['jest-config-loader-options'];

  if (tsLoader === undefined) {
    throw new Error(
      'Jest: Loader is required for the TypeScript configuration files. See https://jestjs.io/docs/configuration',
    );
  }
  if (Array.isArray(tsLoader)) {
    throw new TypeError(
      `Jest: You can only define a single loader through docblocks, got "${tsLoader.join(
        ', ',
      )}"`,
    );
  }
  if (typeof docblockTSLoaderOptions === 'string') {
    extraTSLoaderOptions = JSON.parse(docblockTSLoaderOptions);
  }

  const registeredCompiler = await getRegisteredCompiler(
    tsLoader as TsLoaderModule,
  );
  registeredCompiler.enabled(true);

  let configObject = interopRequireDefault(require(configPath)).default;

  // In case the config is a function which imports more Typescript code
  if (typeof configObject === 'function') {
    configObject = await configObject();
  }

  registeredCompiler.enabled(false);

  return configObject;
};

let registeredCompilerPromise: Promise<TsLoader>;

function getRegisteredCompiler(loader: TsLoaderModule) {
  // Cache the promise to avoid multiple registrations
  registeredCompilerPromise =
    registeredCompilerPromise ?? registerTsLoader(loader);
  return registeredCompilerPromise;
}

async function registerTsLoader(loader: TsLoaderModule): Promise<TsLoader> {
  try {
    // Register TypeScript compiler instance
    if (loader === 'ts-node') {
      const tsLoader = await import(/* webpackIgnore: true */ 'ts-node');

      return tsLoader.register({
        compilerOptions: {
          module: 'CommonJS',
        },
        moduleTypes: {
          '**': 'cjs',
        },
        ...extraTSLoaderOptions,
      });
    } else if (loader === 'esbuild-register') {
      const tsLoader = await import(
        /* webpackIgnore: true */ 'esbuild-register/dist/node'
      );

      let instance: {unregister: () => void} | undefined;

      return {
        enabled: (bool: boolean) => {
          if (bool) {
            instance = tsLoader.register({
              target: `node${process.version.slice(1)}`,
              ...extraTSLoaderOptions,
            });
          } else {
            instance?.unregister();
          }
        },
      };
    }

    throw new Error(
      `Jest: '${loader}' is not a valid TypeScript configuration loader.`,
    );
  } catch (error) {
    if (
      isNativeError(error) &&
      (error as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND'
    ) {
      throw new Error(
        `Jest: '${loader}' is required for the TypeScript configuration files. Make sure it is installed\nError: ${error.message}`,
      );
    }

    throw error;
  }
}
