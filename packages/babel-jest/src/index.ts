/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createHash} from 'crypto';
import * as path from 'path';
import * as fs from 'graceful-fs';
import type {
  TransformOptions as JestTransformOptions,
  Transformer,
} from '@jest/transform';
import type {Config} from '@jest/types';
import {
  PartialConfig,
  PluginItem,
  TransformCaller,
  TransformOptions,
  transformSync as babelTransform,
} from '@babel/core';
import {loadPartialConfig} from './loadBabelConfig';
import chalk = require('chalk');
import slash = require('slash');

const THIS_FILE = fs.readFileSync(__filename);
const jestPresetPath = require.resolve('babel-preset-jest');
const babelIstanbulPlugin = require.resolve('babel-plugin-istanbul');

// Narrow down the types
interface BabelJestTransformer extends Transformer {
  canInstrument: true;
}
interface BabelJestTransformOptions extends TransformOptions {
  caller: TransformCaller;
  compact: false;
  plugins: Array<PluginItem>;
  presets: Array<PluginItem>;
  sourceMaps: 'both';
}

const createTransformer = (
  userOptions?: TransformOptions | null,
): BabelJestTransformer => {
  const inputOptions: TransformOptions = userOptions ?? {};
  const options: BabelJestTransformOptions = {
    ...inputOptions,
    caller: {
      name: 'babel-jest',
      supportsDynamicImport: false,
      supportsStaticESM: false,
      ...inputOptions.caller,
    },
    compact: false,
    plugins: inputOptions.plugins ?? [],
    presets: (inputOptions.presets ?? []).concat(jestPresetPath),
    sourceMaps: 'both',
  };

  function loadBabelConfig(
    cwd: Config.Path,
    filename: Config.Path,
    transformOptions?: JestTransformOptions,
  ): PartialConfig {
    // `cwd` first to allow incoming options to override it
    const babelConfig = loadPartialConfig({
      cwd,
      ...options,
      caller: {
        ...options.caller,
        supportsDynamicImport:
          transformOptions?.supportsDynamicImport ??
          options.caller.supportsDynamicImport,
        supportsStaticESM:
          transformOptions?.supportsStaticESM ??
          options.caller.supportsStaticESM,
      },
      filename,
    });

    if (!babelConfig) {
      throw new Error(
        `babel-jest: Babel ignores ${chalk.bold(
          slash(path.relative(cwd, filename)),
        )} - make sure to include the file in Jest's ${chalk.bold(
          'transformIgnorePatterns',
        )} as well.`,
      );
    }

    return babelConfig;
  }

  return {
    canInstrument: true,
    getCacheKey(fileData, filename, configString, cacheKeyOptions) {
      const {config, instrument, rootDir} = cacheKeyOptions;

      const babelOptions = loadBabelConfig(
        config.cwd,
        filename,
        cacheKeyOptions,
      );
      const configPath = [
        babelOptions.config || '',
        babelOptions.babelrc || '',
      ];

      return createHash('md5')
        .update(THIS_FILE)
        .update('\0', 'utf8')
        .update(JSON.stringify(babelOptions.options))
        .update('\0', 'utf8')
        .update(fileData)
        .update('\0', 'utf8')
        .update(path.relative(rootDir, filename))
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
    },
    process(src, filename, config, transformOptions) {
      const babelOptions = {
        ...loadBabelConfig(config.cwd, filename, transformOptions).options,
      };

      if (transformOptions?.instrument) {
        babelOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
        // Copied from jest-runtime transform.js
        babelOptions.plugins = (babelOptions.plugins || []).concat([
          [
            babelIstanbulPlugin,
            {
              // files outside `cwd` will not be instrumented
              cwd: config.rootDir,
              exclude: [],
            },
          ],
        ]);
      }

      const transformResult = babelTransform(src, babelOptions);

      if (transformResult) {
        const {code, map} = transformResult;
        if (typeof code === 'string') {
          return {code, map};
        }
      }

      return src;
    },
  };
};

const transformer: BabelJestTransformer & {
  createTransformer: (options?: TransformOptions) => BabelJestTransformer;
} = {
  ...createTransformer(),
  // Assigned here so only the exported transformer has `createTransformer`,
  // instead of all created transformers by the function
  createTransformer,
};

export = transformer;
