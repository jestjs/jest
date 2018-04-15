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
import jestPreset from 'babel-preset-jest';
import {transform as babelTransform, util as babelUtil} from 'babel-core';
import babelIstanbulPlugin from 'babel-plugin-istanbul';

const BABELRC_FILENAME = '.babelrc';
const BABELRC_JS_FILENAME = '.babelrc.js';
const BABEL_CONFIG_KEY = 'babel';
const PACKAGE_JSON = 'package.json';
const THIS_FILE = fs.readFileSync(__filename);

const createTransformer = (options: any): Transformer => {
  const cache = Object.create(null);

  const getBabelRC = filename => {
    const paths = [];
    let directory = filename;
    while (directory !== (directory = path.dirname(directory))) {
      if (cache[directory]) {
        break;
      }

      paths.push(directory);
      const configFilePath = path.join(directory, BABELRC_FILENAME);
      if (fs.existsSync(configFilePath)) {
        cache[directory] = fs.readFileSync(configFilePath, 'utf8');
        break;
      }
      const configJsFilePath = path.join(directory, BABELRC_JS_FILENAME);
      if (fs.existsSync(configJsFilePath)) {
        // $FlowFixMe
        cache[directory] = JSON.stringify(require(configJsFilePath));
        break;
      }
      const resolvedJsonFilePath = path.join(directory, PACKAGE_JSON);
      const packageJsonFilePath =
        resolvedJsonFilePath === PACKAGE_JSON
          ? path.resolve(directory, PACKAGE_JSON)
          : resolvedJsonFilePath;
      if (fs.existsSync(packageJsonFilePath)) {
        // $FlowFixMe
        const packageJsonFileContents = require(packageJsonFilePath);
        if (packageJsonFileContents[BABEL_CONFIG_KEY]) {
          cache[directory] = JSON.stringify(
            packageJsonFileContents[BABEL_CONFIG_KEY],
          );
          break;
        }
      }
    }
    paths.forEach(directoryPath => (cache[directoryPath] = cache[directory]));
    return cache[directory] || '';
  };

  options = Object.assign({}, options, {
    compact: false,
    plugins: (options && options.plugins) || [],
    presets: ((options && options.presets) || []).concat([jestPreset]),
    sourceMaps: 'both',
  });
  delete options.cacheDirectory;
  delete options.filename;

  return {
    canInstrument: true,
    getCacheKey(
      fileData: string,
      filename: Path,
      configString: string,
      {instrument, rootDir}: CacheKeyOptions,
    ): string {
      return crypto
        .createHash('md5')
        .update(THIS_FILE)
        .update('\0', 'utf8')
        .update(fileData)
        .update('\0', 'utf8')
        .update(path.relative(rootDir, filename))
        .update('\0', 'utf8')
        .update(configString)
        .update('\0', 'utf8')
        .update(getBabelRC(filename))
        .update('\0', 'utf8')
        .update(instrument ? 'instrument' : '')
        .digest('hex');
    },
    process(
      src: string,
      filename: Path,
      config: ProjectConfig,
      transformOptions?: TransformOptions,
    ): string | TransformedSource {
      const altExts = config.moduleFileExtensions.map(
        extension => '.' + extension,
      );
      if (babelUtil && !babelUtil.canCompile(filename, altExts)) {
        return src;
      }

      const theseOptions = Object.assign({filename}, options);
      if (transformOptions && transformOptions.instrument) {
        theseOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
        // Copied from jest-runtime transform.js
        theseOptions.plugins = theseOptions.plugins.concat([
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

      // babel v7 might return null in the case when the file has been ignored.
      const transformResult = babelTransform(src, theseOptions);

      return transformResult || src;
    },
  };
};

module.exports = createTransformer();
(module.exports: any).createTransformer = createTransformer;
