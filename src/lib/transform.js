/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const crypto = require('crypto');
const fs = require('graceful-fs');
const path = require('path');
const stableStringify = require('json-stable-stringify');

const cache = new Map();
const configToJsonMap = new Map();

const createDirectory = path => {
  if (!fs.existsSync(path)) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code !== 'EEXIST') {
        throw e;
      }
    }
    fs.chmodSync(path, '777');
  }
};

const removeFile = path => {
  try {
    fs.unlinkSync(path);
  } catch (e) {}
};

const getCacheKey = (preprocessor, fileData, filePath, config) => {
  let configStr = configToJsonMap.get(config);
  if (!configStr) {
    configStr = stableStringify(config);
    configToJsonMap.set(config, configStr);
  }
  if (typeof preprocessor.getCacheKey === 'function') {
    return preprocessor.getCacheKey(fileData, filePath, configStr);
  } else {
    return crypto.createHash('md5')
      .update(fileData)
      .update(configStr)
      .digest('hex');
  }
};

const writeCacheFile = (cachePath, fileData) => {
  try {
    fs.writeFileSync(cachePath, fileData);
  } catch (e) {
    e.message = 'jest: failed to cache preprocess results in: ' + cachePath;
    removeFile(cachePath);
    throw e;
  }
};

const readCacheFile = (filePath, cachePath) => {
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

module.exports = (filePath, config) => {
  const mtime = fs.statSync(filePath).mtime;
  const mapCacheKey = filePath + '_' + mtime.getTime();
  const shouldCache =
    config.preprocessCachingDisabled === false && config.cache === true;

  if (cache.has(mapCacheKey)) {
    return cache.get(mapCacheKey);
  }

  let fileData = fs.readFileSync(filePath, 'utf8');
  // If the file data starts with a shebang remove it. Leaves the empty line
  // to keep stack trace line numbers correct.
  if (fileData.startsWith('#!')) {
    fileData = fileData.replace(/^#!.*/, '');
  }

  if (
    config.scriptPreprocessor &&
    !config.preprocessorIgnorePatterns.some(
      pattern => new RegExp(pattern).test(filePath)
    )
  ) {
    const preprocessor = require(config.scriptPreprocessor);
    if (typeof preprocessor.process !== 'function') {
      throw new TypeError(
        'jest: a preprocessor must export a `process` function.'
      );
    }

    if (shouldCache) {
      const baseCacheDir = path.join(config.cacheDirectory, 'preprocess-cache');
      const cacheKey = getCacheKey(preprocessor, fileData, filePath, config);
      // Create sub folders based on the cacheKey to avoid creating one
      // directory with many files.
      const cacheDir = path.join(baseCacheDir, cacheKey[0] + cacheKey[1]);
      const cachePath = path.join(
        cacheDir,
        path.basename(filePath, path.extname(filePath)) + '_' + cacheKey
      );

      createDirectory(baseCacheDir);
      createDirectory(cacheDir);
      const cachedData = readCacheFile(filePath, cachePath);
      if (cachedData) {
        fileData = cachedData;
      } else {
        fileData = preprocessor.process(fileData, filePath, config);
        writeCacheFile(cachePath, fileData);
      }
    } else {
      fileData = preprocessor.process(fileData, filePath, config);
    }
  }

  cache.set(mapCacheKey, fileData);
  return fileData;
};
