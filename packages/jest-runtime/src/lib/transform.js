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

const createDirectory = require('jest-util').createDirectory;
const crypto = require('crypto');
const fs = require('graceful-fs');
const path = require('path');
const stableStringify = require('json-stable-stringify');

const cache = new Map();
const configToJsonMap = new Map();
const preprocessorRegExpCache = new WeakMap();

export type Processor = {
  process: (sourceText: string, sourcePath: Path) => string,
};

type TransformOptions = {
  instrument: (source: string) => string,
};

const removeFile = (path: Path) => {
  try {
    fs.unlinkSync(path);
  } catch (e) {}
};

const getCacheKey = (
  preprocessor: Processor,
  fileData: string,
  filePath: Path,
  config: Config,
): string => {
  if (!configToJsonMap.has(config)) {
    // We only need this set of config options that can likely influence
    // cached output instead of all config options.
    configToJsonMap.set(config, stableStringify({
      cacheDirectory: config.cacheDirectory,
      collectCoverage: config.collectCoverage,
      haste: config.haste,
      mocksPattern: config.mocksPattern,
      moduleFileExtensions: config.moduleFileExtensions,
      moduleNameMapper: config.moduleNameMapper,
      rootDir: config.rootDir,
      testPathDirs: config.testPathDirs,
      testRegex: config.testRegex,
    }));
  }
  const configStr = configToJsonMap.get(config);
  if (typeof preprocessor.getCacheKey === 'function') {
    return preprocessor.getCacheKey(fileData, filePath, configStr);
  } else {
    return crypto.createHash('md5')
      .update(fileData)
      .update(configStr)
      .digest('hex');
  }
};

const writeCacheFile = (cachePath: Path, fileData: string) => {
  try {
    fs.writeFileSync(cachePath, fileData);
  } catch (e) {
    e.message = 'jest: failed to cache preprocess results in: ' + cachePath;
    removeFile(cachePath);
    throw e;
  }
};

const readCacheFile = (filePath: Path, cachePath: Path): ?string => {
  if (!fs.existsSync(cachePath)) {
    return null;
  }

  let fileData;
  try {
    fileData = fs.readFileSync(cachePath, 'utf8');
  } catch (e) {
    e.message = 'jest: failed to read preprocess cache file: ' + cachePath;
    removeFile(cachePath);
    throw e;
  }

  if (fileData == null) {
    // We must have somehow created the file but failed to write to it,
    // let's delete it and retry.
    removeFile(cachePath);
  }
  return fileData;
};

module.exports = (
  filePath: Path,
  config: Config,
  options: ?TransformOptions,
): string => {
  const mtime = fs.statSync(filePath).mtime;
  const mapCacheKey = filePath + '_' + mtime.getTime();

  if (cache.has(mapCacheKey)) {
    return cache.get(mapCacheKey) || '';
  }

  let fileData = fs.readFileSync(filePath, 'utf8');
  // If the file data starts with a shebang remove it. Leaves the empty line
  // to keep stack trace line numbers correct.
  if (fileData.startsWith('#!')) {
    fileData = fileData.replace(/^#!.*/, '');
  }

  if (!preprocessorRegExpCache.has(config)) {
    preprocessorRegExpCache.set(
      config,
      new RegExp(config.preprocessorIgnorePatterns.join('|')),
    );
  }
  const regex = preprocessorRegExpCache.get(config);
  if (
    config.scriptPreprocessor &&
    (
      !config.preprocessorIgnorePatterns.length ||
      !regex.test(filePath)
    )
  ) {
    // $FlowFixMe
    const preprocessor = require(config.scriptPreprocessor);
    if (typeof preprocessor.process !== 'function') {
      throw new TypeError(
        'Jest: a preprocessor must export a `process` function.',
      );
    }

    const baseCacheDir = path.join(config.cacheDirectory, 'preprocess-cache');
    const cacheKey = getCacheKey(preprocessor, fileData, filePath, config);
    // Create sub folders based on the cacheKey to avoid creating one
    // directory with many files.
    const cacheDir = path.join(baseCacheDir, cacheKey[0] + cacheKey[1]);
    const cachePath = path.join(
      cacheDir,
      path.basename(filePath, path.extname(filePath)) + '_' + cacheKey,
    );
    createDirectory(cacheDir);

    const cacheData = config.cache ? readCacheFile(filePath, cachePath) : null;
    if (cacheData) {
      fileData = cacheData;
    } else {
      fileData = preprocessor.process(fileData, filePath, config);
      if (options && options.instrument) {
        fileData = options.instrument(fileData);
      }
      writeCacheFile(cachePath, fileData);
    }
  } else if (options && options.instrument) {
    fileData = options.instrument(fileData);
  }

  cache.set(mapCacheKey, fileData);
  return fileData;
};
