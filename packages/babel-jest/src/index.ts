/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {Config, Transform} from '@jest/types';
import {
  transformSync as babelTransform,
  loadPartialConfig,
  TransformOptions,
  PartialConfig,
} from '@babel/core';
import chalk from 'chalk';
import slash from 'slash';

const THIS_FILE = fs.readFileSync(__filename);
const jestPresetPath = require.resolve('babel-preset-jest');
const babelIstanbulPlugin = require.resolve('babel-plugin-istanbul');

const createTransformer = (
  options: TransformOptions = {},
): Transform.Transformer => {
  options = {
    ...options,
    // @ts-ignore: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/32955
    caller: {
      name: 'babel-jest',
      supportsStaticESM: false,
    },
    compact: false,
    plugins: (options && options.plugins) || [],
    presets: ((options && options.presets) || []).concat(jestPresetPath),
    sourceMaps: 'both',
  };

  // @ts-ignore: seems like this is removed. Is that true?
  delete options.cacheDirectory;

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
      fileData: string,
      filename: Config.Path,
      configString: string,
      {
        config,
        instrument,
        rootDir,
      }: {config: Config.ProjectConfig} & Transform.CacheKeyOptions,
    ): string {
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
    process(
      src: string,
      filename: Config.Path,
      config: Config.ProjectConfig,
      transformOptions?: Transform.TransformOptions,
    ): string | Transform.TransformedSource {
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

      if (transformResult && typeof transformResult.code === 'string') {
        const {code, map} = transformResult;
        if (typeof code === 'string') {
          return {code, map};
        }
      }

      return src;
    },
  };
};

const transformer = createTransformer();

// FIXME: This is not part of the exported TS types. When fixed, remember to
// move @types/babel__core to `dependencies` instead of `devDependencies`
// (one fix is to use ESM, maybe for Jest 25?)
transformer.createTransformer = createTransformer;

export = transformer;
