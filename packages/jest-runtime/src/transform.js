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

type Options = {
  isInternalModule: boolean
};

const EVAL_RESULT_VARIABLE = 'Object.<anonymous>';

const cache: Map<string, vm.Script> = new Map();
const configToJsonMap = new Map();
// Cache regular expressions to test whether the file needs to be preprocessed
const ignoreCache: WeakMap<Config, ?RegExp> = new WeakMap();

const removeFile = (path: Path) => {
  try {
    fs.unlinkSync(path);
  } catch (e) {}
};

const getCacheKey = (
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
      collectCoverageOnlyFrom: config.collectCoverageOnlyFrom,
      coveragePathIgnorePatterns: config.coveragePathIgnorePatterns,
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
  const preprocessor = getPreprocessor(config);

  if (preprocessor && typeof preprocessor.getCacheKey === 'function') {
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

const wrap = content => '({"' +
  EVAL_RESULT_VARIABLE +
  '":function(module,exports,require,__dirname,__filename,global,jest){' +
   content +
   '\n}});';

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

const getScriptCacheKey = (filename, config) => {
  const mtime = fs.statSync(filename).mtime;
  return filename + '_' + mtime.getTime() +
    (shouldInstrument(filename, config) ? '_instrumented' : '');
};

const shouldPreprocess = (filename: Path, config: Config): boolean => {
  if (!ignoreCache.has(config)) {
    if (!config.preprocessorIgnorePatterns) {
      ignoreCache.set(config, null);
    } else {
      ignoreCache.set(
        config,
        new RegExp(config.preprocessorIgnorePatterns.join('|')),
      );
    }
  }

  const ignoreRegexp = ignoreCache.get(config);
  const isIgnored = ignoreRegexp ? ignoreRegexp.test(filename) : false;
  return config.scriptPreprocessor && (
    !config.preprocessorIgnorePatterns.length ||
    !isIgnored
  );
};

const shouldInstrument = (filename: Path, config: Config): boolean => {
  if (!config.collectCoverage) {
    return false;
  }

  if (config.testRegex && filename.match(config.testRegex)) {
    return false;
  }

  if (
    // This configuration field contains an object in the form of:
    // {'path/to/file.js': true}
    config.collectCoverageOnlyFrom &&
    !config.collectCoverageOnlyFrom[filename]
  ) {
    return false;
  }

  if (
    config.coveragePathIgnorePatterns &&
    config.coveragePathIgnorePatterns.some(pattern => filename.match(pattern))
  ) {
    return false;
  }

  if (config.mocksPattern && filename.match(config.mocksPattern)) {
    return false;
  }

  return true;
};

const getFileCachePath = (
  filename: Path,
  config: Config,
  content: string,
): Path => {
  const baseCacheDir = getCacheFilePath(
    config.cacheDirectory,
    'jest-transform-cache-' + config.name,
    VERSION,
  );
  const cacheKey = getCacheKey(content, filename, config);
  // Create sub folders based on the cacheKey to avoid creating one
  // directory with many files.
  const cacheDir = path.join(baseCacheDir, cacheKey[0] + cacheKey[1]);
  const cachePath = path.join(
    cacheDir,
    path.basename(filename, path.extname(filename)) + '_' + cacheKey,
  );
  createDirectory(cacheDir);

  return cachePath;
};

const preprocessorCache = new WeakMap();

const getPreprocessor = (config: Config): ?Processor => {
  if (preprocessorCache.has(config)) {
    return preprocessorCache.get(config);
  } else {
    let preprocessor;
    if (!config.scriptPreprocessor) {
      preprocessor = null;
    } else {
      // $FlowFixMe
      preprocessor = require(config.scriptPreprocessor);
      if (typeof preprocessor.process !== 'function') {
        throw new TypeError(
          'Jest: a preprocessor must export a `process` function.',
        );
      }
    }
    preprocessorCache.set(config, preprocessor);
    return preprocessor;
  }
};

const stripShebang = content => {
  // If the file data starts with a shebang remove it. Leaves the empty line
  // to keep stack trace line numbers correct.
  if (content.startsWith('#!')) {
    return content.replace(/^#!.*/, '');
  } else {
    return content;
  }
};

const instrument = (content: string, filename: Path): string => {
  // NOTE: Keeping these requires inside this function reduces a single run
  // time by 2sec if not running in `--coverage` mode
  const babel = require('babel-core');
  const babelPluginIstanbul = require('babel-plugin-istanbul').default;

  if (babel.util.canCompile(filename)) {
    return babel.transform(content, {
      filename,
      auxiliaryCommentBefore: ' istanbul ignore next ',
      plugins: [
        [
          babelPluginIstanbul,
          // right now babel-plugin-istanbul doesn't have any configuration
          // for bypassing the excludes check, but there is a config for
          // overwriting it. `.^` as a regexp that matches nothing.
          // @see https://github.com/istanbuljs/test-exclude/issues/7
          {exclude: ['.^']},
        ],
      ],
      retainLines: true,
      babelrc: false,
    }).code;
  }
  return content;
};

const cachedTransformAndWrap = (
  filename: Path,
  config: Config,
  content: string
) => {
  const preprocessor = getPreprocessor(config);
  const cacheFilePath = getFileCachePath(filename, config, content);
  // Ignore cache if `config.cache` is set (--no-cache)
  let result = config.cache ? readCacheFile(filename, cacheFilePath) : null;

  if (result) {
    return result;
  }

  result = content;

  if (preprocessor && shouldPreprocess(filename, config)) {
    result = preprocessor.process(result, filename, config);
  }
  if (shouldInstrument(filename, config)) {
    result = instrument(result, filename, config);
  }

  result = wrap(result);
  writeCacheFile(cacheFilePath, result);
  return result;
};

const transformAndBuildScript = (
  filename: Path,
  config: Config,
  options: ?Options,
): vm.Script => {
  const isInternalModule = !!(options && options.isInternalModule);
  const content = stripShebang(fs.readFileSync(filename, 'utf8'));
  let wrappedResult;

  if (
    !isInternalModule &&
      (shouldPreprocess(filename, config) || shouldInstrument(filename, config))
  ) {
    wrappedResult = cachedTransformAndWrap(filename, config, content);
  } else {
    wrappedResult = wrap(content);
  }

  return new vm.Script(wrappedResult, {displayErrors: true, filename});
};

module.exports = (
  filename: Path,
  config: Config,
  options: ?Options,
): vm.Script => {
  const scriptCacheKey = getScriptCacheKey(filename, config);
  let script = cache.get(scriptCacheKey);
  if (script) {
    return script;
  } else {
    script = transformAndBuildScript(filename, config, options);
    cache.set(scriptCacheKey, script);
    return script;
  }
};

module.exports.EVAL_RESULT_VARIABLE = EVAL_RESULT_VARIABLE;
