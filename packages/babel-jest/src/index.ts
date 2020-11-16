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
} from '@babel/core';
import chalk = require('chalk');
import * as fs from 'graceful-fs';
import slash = require('slash');
import type {
  TransformOptions as JestTransformOptions,
  Transformer,
} from '@jest/transform';
import type {Config} from '@jest/types';
import {loadPartialConfig} from './loadBabelConfig';

const THIS_FILE = fs.readFileSync(__filename);
const jestPresetPath = require.resolve('babel-preset-jest');
const babelIstanbulPlugin = require.resolve('babel-plugin-istanbul');

type CreateTransformer = Transformer<TransformOptions>['createTransformer'];

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
        supportsExportNamespaceFrom:
          transformOptions?.supportsExportNamespaceFrom ??
          options.caller.supportsExportNamespaceFrom,
        supportsStaticESM:
          transformOptions?.supportsStaticESM ??
          options.caller.supportsStaticESM,
        supportsTopLevelAwait:
          transformOptions?.supportsTopLevelAwait ??
          options.caller.supportsTopLevelAwait,
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
    getCacheKey(sourceText, sourcePath, transformOptions) {
      const {config, configString, instrument} = transformOptions;

      const babelOptions = loadBabelConfig(
        config.cwd,
        sourcePath,
        transformOptions,
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
    },
    process(sourceText, sourcePath, transformOptions) {
      const babelOptions = {
        ...loadBabelConfig(
          transformOptions.config.cwd,
          sourcePath,
          transformOptions,
        ).options,
      };

      if (transformOptions?.instrument) {
        babelOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
        // Copied from jest-runtime transform.js
        babelOptions.plugins = (babelOptions.plugins || []).concat([
          [
            babelIstanbulPlugin,
            {
              // files outside `cwd` will not be instrumented
              cwd: transformOptions.config.rootDir,
              exclude: [],
            },
          ],
        ]);
      }

      const transformResult = babelTransform(sourceText, babelOptions);

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

const transformer: Transformer<TransformOptions> & {
  createTransformer: CreateTransformer;
} = {
  ...createTransformer(),
  // Assigned here so only the exported transformer has `createTransformer`,
  // instead of all created transformers by the function
  createTransformer,
};

export = transformer;
