/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Config, Path} from 'types/Config';
import type {TransformOptions} from 'types/Transform';

const crypto = require('crypto');
const fs = require('fs');
const jestPreset = require('babel-preset-jest');
const path = require('path');

const BABELRC_FILENAME = '.babelrc';
const THIS_FILE = fs.readFileSync(__filename);

const cache = Object.create(null);

let babel;

const getBabelRC = (filename, {useCache}) => {
  const paths = [];
  let directory = filename;
  while (directory !== (directory = path.dirname(directory))) {
    if (useCache && cache[directory]) {
      break;
    }

    paths.push(directory);
    const configFilePath = path.join(directory, BABELRC_FILENAME);
    if (fs.existsSync(configFilePath)) {
      cache[directory] = fs.readFileSync(configFilePath, 'utf8');
      break;
    }
  }
  paths.forEach(directoryPath => {
    cache[directoryPath] = cache[directory];
  });

  return cache[directory] || '';
};

const createTransformer = (options: any) => {
  options = Object.assign({}, options, {
    plugins: options && options.plugins || [],
    presets: (options && options.presets || []).concat([jestPreset]),
    retainLines: true,
  });
  delete options.cacheDirectory;
  delete options.filename;

  return {
    canInstrument: true,
    getCacheKey(
      fileData: string,
      filename: Path,
      configString: string,
      {instrument, watch}: TransformOptions,
    ): string {
      return crypto
        .createHash('md5')
        .update(THIS_FILE)
        .update('\0', 'utf8')
        .update(fileData)
        .update('\0', 'utf8')
        .update(configString)
        .update('\0', 'utf8')
        // Don't use the in-memory cache in watch mode because the .babelrc
        // file may be modified.
        .update(getBabelRC(filename, {useCache: !watch}))
        .update('\0', 'utf8')
        .update(instrument ? 'instrument' : '')
        .digest('hex');
    },
    process(
      src: string,
      filename: Path,
      config: Config,
      transformOptions: TransformOptions,
    ): string {
      if (!babel) {
        babel = require('babel-core');
      }

      if (!babel.util.canCompile(filename)) {
        return src;
      }

      const theseOptions = Object.assign({filename}, options);

      if (transformOptions && transformOptions.instrument) {
        theseOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
        // Copied from jest-runtime transform.js
        theseOptions.plugins = theseOptions.plugins.concat([
          [
            require('babel-plugin-istanbul').default,
            {
              // files outside `cwd` will not be instrumented
              cwd: config.rootDir,
              exclude: [],
            },
          ],
        ]);
      }

      return babel.transform(src, theseOptions).code;
    },
  };
};

module.exports = createTransformer();
(module.exports: any).createTransformer = createTransformer;
