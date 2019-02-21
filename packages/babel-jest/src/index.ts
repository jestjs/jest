/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {Transformer} from '@jest/transform';
import {Config} from '@jest/types';
import {
  loadPartialConfig,
  PartialConfig,
  TransformOptions,
  transformSync as babelTransform,
} from '@babel/core';
import chalk from 'chalk';
import slash from 'slash';

const THIS_FILE = fs.readFileSync(__filename);
const jestPresetPath = require.resolve('babel-preset-jest');
const babelIstanbulPlugin = require.resolve('babel-plugin-istanbul');

// Narrow down the types
interface BabelJestTransformer extends Transformer {
  canInstrument: true;
}

const createTransformer = (
  options: TransformOptions = {},
): BabelJestTransformer => {
  options = {
    ...options,
    caller: {
      name: 'babel-jest',
      supportsStaticESM: false,
    },
    compact: false,
    plugins: (options && options.plugins) || [],
    presets: ((options && options.presets) || []).concat(jestPresetPath),
    sourceMaps: 'both',
  };

  function loadBabelConfig(
    cwd: Config.Path,
    filename: Config.Path,
  ): PartialConfig {
    // `cwd` first to allow incoming options to override it
    const babelConfig = loadPartialConfig({cwd, ...options, filename});

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
    getCacheKey(
      fileData,
      filename,
      configString,
      {config, instrument, rootDir},
    ) {
      const babelOptions = loadBabelConfig(config.cwd, filename);
      const configPath = [
        babelOptions.config || '',
        babelOptions.babelrc || '',
      ];

      return crypto
        .createHash('md5')
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
      const babelOptions = {...loadBabelConfig(config.cwd, filename).options};

      if (transformOptions && transformOptions.instrument) {
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
