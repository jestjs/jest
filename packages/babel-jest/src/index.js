/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Path, ProjectConfig} from 'types/Config';
import type {
  CacheKeyOptions,
  Transformer,
  TransformOptions,
  TransformedSource,
} from 'types/Transform';

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {transformSync as babelTransform, loadPartialConfig} from '@babel/core';
import babelIstanbulPlugin from 'babel-plugin-istanbul';

const THIS_FILE = fs.readFileSync(__filename);
const jestPresetPath = require.resolve('babel-preset-jest');

export const createTransformer = (options: any): Transformer => {
  options = Object.assign({}, options, {
    compact: false,
    plugins: (options && options.plugins) || [],
    presets: ((options && options.presets) || []).concat(jestPresetPath),
    sourceMaps: 'both',
  });

  delete options.cacheDirectory;
  delete options.filename;

  const loadBabelOptions = filename =>
    loadPartialConfig({
      ...options,
      caller: {
        name: 'babel-jest',
        supportsStaticESM: false,
      },
      filename,
    });

  return {
    canInstrument: true,
    getCacheKey(
      fileData: string,
      filename: Path,
      configString: string,
      {instrument, rootDir}: CacheKeyOptions,
    ): string {
      const babelOptions = loadBabelOptions(filename);
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
      filename: Path,
      config: ProjectConfig,
      transformOptions?: TransformOptions,
    ): string | TransformedSource {
      const babelOptions = {...loadBabelOptions(filename).options};

      if (transformOptions && transformOptions.instrument) {
        babelOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
        // Copied from jest-runtime transform.js
        babelOptions.plugins = babelOptions.plugins.concat([
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

      return transformResult || src;
    },
  };
};

export default createTransformer();
