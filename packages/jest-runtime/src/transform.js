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
const fileExists = require('jest-file-exists');
const fs = require('graceful-fs');
const getCacheFilePath = require('jest-haste-map').getCacheFilePath;
const path = require('path');
const stableStringify = require('json-stable-stringify');
const vm = require('vm');

const VERSION = require('../package.json').version;

export type Processor = {
  process: (sourceText: string, sourcePath: Path) => string,
};

type TransformOptions = {
  instrument: (source: string) => string,
};

const EVAL_RESULT_VARIABLE = 'Object.<anonymous>';

const cache = new Map();
const configToJsonMap = new Map();
const ignoreCache = new WeakMap();

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
  const configStr = configToJsonMap.get(config) || '';
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
    fs.writeFileSync(cachePath, fileData, 'utf8');
  } catch (e) {
    e.message = 'jest: failed to cache transform results in: ' + cachePath;
    removeFile(cachePath);
    throw e;
  }
};

/* eslint-disable max-len */
const wrap = content => '({"' + EVAL_RESULT_VARIABLE + '":function(module,exports,require,__dirname,__filename,global,jest,$JEST){' + content + '\n}});';
/* eslint-enable max-len */

const readCacheFile = (filePath: Path, cachePath: Path): ?string => {
  if (!fileExists(cachePath)) {
    return null;
  }

  let fileData;
  try {
    fileData = fs.readFileSync(cachePath, 'utf8');
  } catch (e) {
    e.message = 'jest: failed to read cache file: ' + cachePath;
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
  filename: Path,
  config: Config,
  options: ?TransformOptions,
): vm.Script => {
  const mtime = fs.statSync(filename).mtime;
  const instrumentCacheKey = (options && options.instrument ? '1' : '0');
  const key = filename + '-' + mtime.getTime() + '-' + instrumentCacheKey;

  if (cache.has(key)) {
    const content = cache.get(key);
    if (content) {
      return content;
    }
  }

  let content = fs.readFileSync(filename, 'utf8');
  // If the file data starts with a shebang remove it. Leaves the empty line
  // to keep stack trace line numbers correct.
  if (content.startsWith('#!')) {
    content = content.replace(/^#!.*/, '');
  }

  if (!ignoreCache.has(config)) {
    ignoreCache.set(
      config,
      new RegExp(config.preprocessorIgnorePatterns.join('|')),
    );
  }

  if (
    config.scriptPreprocessor &&
    (
      !config.preprocessorIgnorePatterns.length ||
      !ignoreCache.get(config).test(filename)
    )
  ) {
    // $FlowFixMe
    const preprocessor = require(config.scriptPreprocessor);
    if (typeof preprocessor.process !== 'function') {
      throw new TypeError(
        'Jest: a preprocessor must export a `process` function.',
      );
    }

    const baseCacheDir = getCacheFilePath(
      config.cacheDirectory,
      'jest-transform-cache-' + config.name,
      VERSION,
    );
    const cacheKey =
      getCacheKey(preprocessor, content, filename, config) +
      instrumentCacheKey;

    // Create sub folders based on the cacheKey to avoid creating one
    // directory with many files.
    const cacheDir = path.join(baseCacheDir, cacheKey[0] + cacheKey[1]);
    const cachePath = path.join(
      cacheDir,
      path.basename(filename, path.extname(filename)) + '_' + cacheKey,
    );
    createDirectory(cacheDir);

    const cacheData = config.cache ? readCacheFile(filename, cachePath) : null;
    if (cacheData) {
      content = cacheData;
    } else {
      content = preprocessor.process(content, filename, config);
      if (options && options.instrument) {
        content = options.instrument(content);
      }
      content = wrap(content);
      writeCacheFile(cachePath, content);
    }
  } else if (options && options.instrument) {
    content = wrap(options.instrument(content));
  } else {
    content = wrap(content);
  }

  const script = new vm.Script(content, {
    displayErrors: true,
    filename,
  });

  cache.set(key, script);
  return script;
};

module.exports.EVAL_RESULT_VARIABLE = EVAL_RESULT_VARIABLE;
