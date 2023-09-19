/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
  TransformerCreator,
} from '@jest/transform';
import {loadPartialConfig, loadPartialConfigAsync} from './loadBabelConfig';

const THIS_FILE = fs.readFileSync(__filename);
const jestPresetPath = require.resolve('babel-preset-jest');
const babelIstanbulPlugin = require.resolve('babel-plugin-istanbul');

function assertLoadedBabelConfig(
  babelConfig: Readonly<PartialConfig> | null,
  cwd: string,
  filename: string,
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
    copiedBabelOptions.plugins = (copiedBabelOptions.plugins ?? []).concat([
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
  sourcePath: string,
  babelOptions: PartialConfig,
  transformOptions: JestTransformOptions,
): string {
  const {config, configString, instrument} = transformOptions;

  const configPath = [babelOptions.config ?? '', babelOptions.babelrc ?? ''];

  return createHash('sha1')
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
    .update(process.env.NODE_ENV ?? '')
    .update('\0', 'utf8')
    .update(process.env.BABEL_ENV ?? '')
    .update('\0', 'utf8')
    .update(process.version)
    .digest('hex')
    .substring(0, 32);
}

function loadBabelConfig(
  cwd: string,
  filename: string,
  transformOptions: TransformOptions,
): PartialConfig {
  const babelConfig = loadPartialConfig(transformOptions);

  assertLoadedBabelConfig(babelConfig, cwd, filename);

  return babelConfig;
}

async function loadBabelConfigAsync(
  cwd: string,
  filename: string,
  transformOptions: TransformOptions,
): Promise<PartialConfig> {
  const babelConfig = await loadPartialConfigAsync(transformOptions);

  assertLoadedBabelConfig(babelConfig, cwd, filename);

  return babelConfig;
}

function loadBabelOptions(
  cwd: string,
  filename: string,
  transformOptions: TransformOptions,
  jestTransformOptions: JestTransformOptions,
): TransformOptions {
  const {options} = loadBabelConfig(cwd, filename, transformOptions);

  return addIstanbulInstrumentation(options, jestTransformOptions);
}

async function loadBabelOptionsAsync(
  cwd: string,
  filename: string,
  transformOptions: TransformOptions,
  jestTransformOptions: JestTransformOptions,
): Promise<TransformOptions> {
  const {options} = await loadBabelConfigAsync(cwd, filename, transformOptions);

  return addIstanbulInstrumentation(options, jestTransformOptions);
}

export const createTransformer: TransformerCreator<
  SyncTransformer<TransformOptions>,
  TransformOptions
> = userOptions => {
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
    filename: string,
    transformOptions: JestTransformOptions,
  ): TransformOptions {
    const {cwd, rootDir} = transformOptions.config;
    // `cwd` and `root` first to allow incoming options to override it
    return {
      cwd,
      root: rootDir,
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

  return {
    canInstrument: true,
    getCacheKey(sourceText, sourcePath, transformOptions) {
      const babelOptions = loadBabelConfig(
        transformOptions.config.cwd,
        sourcePath,
        mergeBabelTransformOptions(sourcePath, transformOptions),
      );

      return getCacheKeyFromConfig(
        sourceText,
        sourcePath,
        babelOptions,
        transformOptions,
      );
    },
    async getCacheKeyAsync(sourceText, sourcePath, transformOptions) {
      const babelOptions = await loadBabelConfigAsync(
        transformOptions.config.cwd,
        sourcePath,
        mergeBabelTransformOptions(sourcePath, transformOptions),
      );

      return getCacheKeyFromConfig(
        sourceText,
        sourcePath,
        babelOptions,
        transformOptions,
      );
    },
    process(sourceText, sourcePath, transformOptions) {
      const babelOptions = loadBabelOptions(
        transformOptions.config.cwd,
        sourcePath,
        mergeBabelTransformOptions(sourcePath, transformOptions),
        transformOptions,
      );

      const transformResult = babelTransform(sourceText, babelOptions);

      if (transformResult) {
        const {code, map} = transformResult;
        if (typeof code === 'string') {
          return {code, map};
        }
      }

      return {code: sourceText};
    },
    async processAsync(sourceText, sourcePath, transformOptions) {
      const babelOptions = await loadBabelOptionsAsync(
        transformOptions.config.cwd,
        sourcePath,
        mergeBabelTransformOptions(sourcePath, transformOptions),
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

      return {code: sourceText};
    },
  };
};

const transformerFactory = {
  // Assigned here, instead of as a separate export, due to limitations in Jest's
  // requireOrImportModule, requiring all exports to be on the `default` export
  createTransformer,
};

export default transformerFactory;
