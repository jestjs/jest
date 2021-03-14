/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createHash} from 'crypto';
import * as path from 'path';
import {
  PartialConfig,
  TransformOptions,
  transformSync as babelTransform,
  transformAsync as babelTransformAsync,
} from '@babel/core';
import chalk = require('chalk');
import * as fs from 'graceful-fs';
import slash = require('slash');
import type {
  TransformOptions as JestTransformOptions,
  SyncTransformer,
} from '@jest/transform';
import type {Config} from '@jest/types';
import {loadPartialConfig, loadPartialConfigAsync} from './loadBabelConfig';

const THIS_FILE = fs.readFileSync(__filename);
const jestPresetPath = require.resolve('babel-preset-jest');
const babelIstanbulPlugin = require.resolve('babel-plugin-istanbul');

type CreateTransformer = SyncTransformer<TransformOptions>['createTransformer'];

function assertLoadedBabelConfig(
  babelConfig: Readonly<PartialConfig> | null,
  cwd: Config.Path,
  filename: Config.Path,
): asserts babelConfig {
  if (!babelConfig) {
    throw new Error(
      `babel-jest: Babel ignores ${chalk.bold(
        slash(path.relative(cwd, filename)),
      )} - make sure to include the file in Jest's ${chalk.bold(
        'transformIgnorePatterns',
      )} as well.`,
    );
  }
}

function addIstanbulInstrumentation(
  babelOptions: TransformOptions,
  transformOptions: JestTransformOptions,
): TransformOptions {
  if (transformOptions.instrument) {
    const copiedBabelOptions: TransformOptions = {...babelOptions};
    copiedBabelOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
    // Copied from jest-runtime transform.js
    copiedBabelOptions.plugins = (copiedBabelOptions.plugins || []).concat([
      [
        babelIstanbulPlugin,
        {
          // files outside `cwd` will not be instrumented
          cwd: transformOptions.config.cwd,
          exclude: [],
        },
      ],
    ]);

    return copiedBabelOptions;
  }

  return babelOptions;
}

function getCacheKeyFromConfig(
  sourceText: string,
  sourcePath: Config.Path,
  babelOptions: PartialConfig,
  transformOptions: JestTransformOptions,
): string {
  const {config, configString, instrument} = transformOptions;

  const configPath = [babelOptions.config || '', babelOptions.babelrc || ''];

  return createHash('md5')
    .update(THIS_FILE)
    .update('\0', 'utf8')
    .update(JSON.stringify(babelOptions.options))
    .update('\0', 'utf8')
    .update(sourceText)
    .update('\0', 'utf8')
    .update(path.relative(config.rootDir, sourcePath))
    .update('\0', 'utf8')
    .update(configString)
    .update('\0', 'utf8')
    .update(configPath.join(''))
    .update('\0', 'utf8')
    .update(instrument ? 'instrument' : '')
    .update('\0', 'utf8')
    .update(process.env.NODE_ENV || '')
    .update('\0', 'utf8')
    .update(process.env.BABEL_ENV || '')
    .digest('hex');
}

const createTransformer: CreateTransformer = userOptions => {
  const inputOptions = userOptions ?? {};

  const options = {
    ...inputOptions,
    caller: {
      name: 'babel-jest',
      supportsDynamicImport: false,
      supportsExportNamespaceFrom: false,
      supportsStaticESM: false,
      supportsTopLevelAwait: false,
      ...inputOptions.caller,
    },
    compact: false,
    plugins: inputOptions.plugins ?? [],
    presets: (inputOptions.presets ?? []).concat(jestPresetPath),
    sourceMaps: 'both',
  } as const;

  function mergeBabelTransformOptions(
    filename: Config.Path,
    transformOptions: JestTransformOptions,
  ): TransformOptions {
    const {cwd} = transformOptions.config;
    // `cwd` first to allow incoming options to override it
    return {
      cwd,
      ...options,
      caller: {
        ...options.caller,
        supportsDynamicImport:
          transformOptions.supportsDynamicImport ??
          options.caller.supportsDynamicImport,
        supportsExportNamespaceFrom:
          transformOptions.supportsExportNamespaceFrom ??
          options.caller.supportsExportNamespaceFrom,
        supportsStaticESM:
          transformOptions.supportsStaticESM ??
          options.caller.supportsStaticESM,
        supportsTopLevelAwait:
          transformOptions.supportsTopLevelAwait ??
          options.caller.supportsTopLevelAwait,
      },
      filename,
    };
  }

  function loadBabelConfig(
    filename: Config.Path,
    transformOptions: JestTransformOptions,
  ): PartialConfig {
    const babelConfig = loadPartialConfig(
      mergeBabelTransformOptions(filename, transformOptions),
    );

    assertLoadedBabelConfig(babelConfig, transformOptions.config.cwd, filename);

    return babelConfig;
  }

  async function loadBabelConfigAsync(
    filename: Config.Path,
    transformOptions: JestTransformOptions,
  ): Promise<PartialConfig> {
    const babelConfig = await loadPartialConfigAsync(
      mergeBabelTransformOptions(filename, transformOptions),
    );

    assertLoadedBabelConfig(babelConfig, transformOptions.config.cwd, filename);

    return babelConfig;
  }

  function loadBabelOptions(
    filename: Config.Path,
    transformOptions: JestTransformOptions,
  ): TransformOptions {
    const {options} = loadBabelConfig(filename, transformOptions);

    return addIstanbulInstrumentation(options, transformOptions);
  }

  async function loadBabelOptionsAsync(
    filename: Config.Path,
    transformOptions: JestTransformOptions,
  ): Promise<TransformOptions> {
    const {options} = await loadBabelConfigAsync(filename, transformOptions);

    return addIstanbulInstrumentation(options, transformOptions);
  }

  return {
    canInstrument: true,
    getCacheKey(sourceText, sourcePath, transformOptions) {
      const babelOptions = loadBabelConfig(sourcePath, transformOptions);

      return getCacheKeyFromConfig(
        sourceText,
        sourcePath,
        babelOptions,
        transformOptions,
      );
    },
    async getCacheKeyAsync(sourceText, sourcePath, transformOptions) {
      const babelOptions = await loadBabelConfigAsync(
        sourcePath,
        transformOptions,
      );

      return getCacheKeyFromConfig(
        sourceText,
        sourcePath,
        babelOptions,
        transformOptions,
      );
    },
    process(sourceText, sourcePath, transformOptions) {
      const babelOptions = loadBabelOptions(sourcePath, transformOptions);

      const transformResult = babelTransform(sourceText, babelOptions);

      if (transformResult) {
        const {code, map} = transformResult;
        if (typeof code === 'string') {
          return {code, map};
        }
      }

      return sourceText;
    },
    async processAsync(sourceText, sourcePath, transformOptions) {
      const babelOptions = await loadBabelOptionsAsync(
        sourcePath,
        transformOptions,
      );

      const transformResult = await babelTransformAsync(
        sourceText,
        babelOptions,
      );

      if (transformResult) {
        const {code, map} = transformResult;
        if (typeof code === 'string') {
          return {code, map};
        }
      }

      return sourceText;
    },
  };
};

const transformer: SyncTransformer<TransformOptions> = {
  ...createTransformer(),
  // Assigned here so only the exported transformer has `createTransformer`,
  // instead of all created transformers by the function
  createTransformer,
};

export = transformer;
