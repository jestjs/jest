/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Glob, Path, ProjectConfig} from 'types/Config';
import type {
  Transformer,
  TransformedSource,
  TransformResult,
} from 'types/Transform';

import crypto from 'crypto';
import path from 'path';
import vm from 'vm';
import {createDirectory} from 'jest-util';
import fs from 'graceful-fs';
import {transform as babelTransform} from 'babel-core';
import babelPluginIstanbul from 'babel-plugin-istanbul';
import convertSourceMap from 'convert-source-map';
import HasteMap from 'jest-haste-map';
import stableStringify from 'json-stable-stringify';
import slash from 'slash';
import {version as VERSION} from '../package.json';
import shouldInstrument from './should_instrument';
import writeFileAtomic from 'write-file-atomic';

export type Options = {|
  collectCoverage: boolean,
  collectCoverageFrom: Array<Glob>,
  collectCoverageOnlyFrom: ?{[key: string]: boolean},
  isInternalModule?: boolean,
  mapCoverage: boolean,
|};

const cache: Map<string, TransformResult> = new Map();
const configToJsonMap = new Map();
// Cache regular expressions to test whether the file needs to be preprocessed
const ignoreCache: WeakMap<ProjectConfig, ?RegExp> = new WeakMap();

// To reset the cache for specific changesets (rather than package version).
const CACHE_VERSION = '1';

class ScriptTransformer {
  static EVAL_RESULT_VARIABLE: string;
  _config: ProjectConfig;
  _transformCache: Map<Path, ?Transformer>;

  constructor(config: ProjectConfig) {
    this._config = config;
    this._transformCache = new Map();
  }

  _getCacheKey(
    fileData: string,
    filename: Path,
    instrument: boolean,
    mapCoverage: boolean,
  ): string {
    if (!configToJsonMap.has(this._config)) {
      // We only need this set of config options that can likely influence
      // cached output instead of all config options.
      configToJsonMap.set(this._config, stableStringify(this._config));
    }
    const configString = configToJsonMap.get(this._config) || '';
    const transformer = this._getTransformer(filename);

    if (transformer && typeof transformer.getCacheKey === 'function') {
      return crypto
        .createHash('md5')
        .update(
          transformer.getCacheKey(fileData, filename, configString, {
            instrument,
            mapCoverage,
          }),
        )
        .update(CACHE_VERSION)
        .digest('hex');
    } else {
      return crypto
        .createHash('md5')
        .update(fileData)
        .update(configString)
        .update(instrument ? 'instrument' : '')
        .update(mapCoverage ? 'mapCoverage' : '')
        .update(CACHE_VERSION)
        .digest('hex');
    }
  }

  _getFileCachePath(
    filename: Path,
    content: string,
    instrument: boolean,
    mapCoverage: boolean,
  ): Path {
    const baseCacheDir = HasteMap.getCacheFilePath(
      this._config.cacheDirectory,
      'jest-transform-cache-' + this._config.name,
      VERSION,
    );
    const cacheKey = this._getCacheKey(
      content,
      filename,
      instrument,
      mapCoverage,
    );
    // Create sub folders based on the cacheKey to avoid creating one
    // directory with many files.
    const cacheDir = path.join(baseCacheDir, cacheKey[0] + cacheKey[1]);
    const cachePath = slash(
      path.join(
        cacheDir,
        path.basename(filename, path.extname(filename)) + '_' + cacheKey,
      ),
    );
    createDirectory(cacheDir);

    return cachePath;
  }

  _getTransformPath(filename: Path) {
    for (let i = 0; i < this._config.transform.length; i++) {
      if (new RegExp(this._config.transform[i][0]).test(filename)) {
        return this._config.transform[i][1];
      }
    }
    return null;
  }

  _getTransformer(filename: Path) {
    let transform: ?Transformer;
    if (!this._config.transform || !this._config.transform.length) {
      return null;
    }

    const transformPath = this._getTransformPath(filename);
    if (transformPath) {
      const transformer = this._transformCache.get(transformPath);
      if (transformer != null) {
        return transformer;
      }

      // $FlowFixMe
      transform = (require(transformPath): Transformer);
      if (typeof transform.process !== 'function') {
        throw new TypeError(
          'Jest: a transform must export a `process` function.',
        );
      }
      if (typeof transform.createTransformer === 'function') {
        transform = transform.createTransformer();
      }
      this._transformCache.set(transformPath, transform);
    }
    return transform;
  }

  _instrumentFile(filename: Path, content: string): string {
    return babelTransform(content, {
      auxiliaryCommentBefore: ' istanbul ignore next ',
      babelrc: false,
      filename,
      plugins: [
        [
          babelPluginIstanbul,
          {
            // files outside `cwd` will not be instrumented
            cwd: this._config.rootDir,
            exclude: [],
            useInlineSourceMaps: false,
          },
        ],
      ],
      retainLines: true,
    }).code;
  }

  transformSource(
    filename: Path,
    content: string,
    instrument: boolean,
    mapCoverage: boolean,
  ) {
    const transform = this._getTransformer(filename);
    const cacheFilePath = this._getFileCachePath(
      filename,
      content,
      instrument,
      mapCoverage,
    );
    let sourceMapPath = cacheFilePath + '.map';
    // Ignore cache if `config.cache` is set (--no-cache)
    let code = this._config.cache ? readCodeCacheFile(cacheFilePath) : null;

    if (code) {
      // This is broken: we return the code, and a path for the source map
      // directly from the cache. But, nothing ensures the source map actually
      // matches that source code. They could have gotten out-of-sync in case
      // two separate processes write concurrently to the same cache files.
      return {
        code,
        sourceMapPath,
      };
    }

    let transformed: TransformedSource = {
      code: content,
      map: null,
    };

    if (transform && shouldTransform(filename, this._config)) {
      const processed = transform.process(content, filename, this._config, {
        instrument,
      });

      if (typeof processed === 'string') {
        transformed.code = processed;
      } else if (processed != null && typeof processed.code === 'string') {
        transformed = processed;
      } else {
        throw new TypeError(
          "Jest: a transform's `process` function must return a string, " +
            'or an object with `code` key containing this string.',
        );
      }
    }

    if (mapCoverage) {
      if (!transformed.map) {
        const inlineSourceMap = convertSourceMap.fromSource(transformed.code);
        if (inlineSourceMap) {
          transformed.map = inlineSourceMap.toJSON();
        }
      }
    } else {
      transformed.map = null;
    }

    // That means that the transform has a custom instrumentation
    // logic and will handle it based on `config.collectCoverage` option
    const transformDidInstrument = transform && transform.canInstrument;

    if (!transformDidInstrument && instrument) {
      code = this._instrumentFile(filename, transformed.code);
    } else {
      code = transformed.code;
    }

    if (instrument && transformed.map && mapCoverage) {
      const sourceMapContent =
        typeof transformed.map === 'string'
          ? transformed.map
          : JSON.stringify(transformed.map);
      writeCacheFile(sourceMapPath, sourceMapContent);
    } else {
      sourceMapPath = null;
    }

    writeCodeCacheFile(cacheFilePath, code);

    return {
      code,
      sourceMapPath,
    };
  }

  _transformAndBuildScript(
    filename: Path,
    options: ?Options,
    instrument: boolean,
    fileSource?: string,
  ): TransformResult {
    const isInternalModule = !!(options && options.isInternalModule);
    const content = stripShebang(
      fileSource || fs.readFileSync(filename, 'utf8'),
    );
    let wrappedCode: string;
    let sourceMapPath: ?string = null;
    const willTransform =
      !isInternalModule &&
      (shouldTransform(filename, this._config) || instrument);

    try {
      if (willTransform) {
        const transformedSource = this.transformSource(
          filename,
          content,
          instrument,
          !!(options && options.mapCoverage),
        );

        wrappedCode = wrap(transformedSource.code);
        sourceMapPath = transformedSource.sourceMapPath;
      } else {
        wrappedCode = wrap(content);
      }

      return {
        script: new vm.Script(wrappedCode, {displayErrors: true, filename}),
        sourceMapPath,
      };
    } catch (e) {
      if (e.codeFrame) {
        e.stack = e.codeFrame;
      }

      throw e;
    }
  }

  transform(
    filename: Path,
    options: Options,
    fileSource?: string,
  ): TransformResult {
    const instrument = shouldInstrument(filename, options, this._config);
    const scriptCacheKey = getScriptCacheKey(
      filename,
      this._config,
      instrument,
    );
    let result = cache.get(scriptCacheKey);
    if (result) {
      return result;
    } else {
      result = this._transformAndBuildScript(
        filename,
        options,
        instrument,
        fileSource,
      );
      cache.set(scriptCacheKey, result);
      return result;
    }
  }
}

const removeFile = (path: Path) => {
  try {
    fs.unlinkSync(path);
  } catch (e) {}
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

/**
 * This is like `writeCacheFile` but with an additional sanity checksum. We
 * cannot use the same technique for source maps because we expose source map
 * cache file paths directly to callsites, with the expectation they can read
 * it right away. This is not a great system, because source map cache file
 * could get corrupted, out-of-sync, etc.
 */
function writeCodeCacheFile(cachePath: Path, code: string) {
  const checksum = crypto.createHash('md5').update(code).digest('hex');
  writeCacheFile(cachePath, checksum + '\n' + code);
}

/**
 * Read counterpart of `writeCodeCacheFile`. We verify that the content of the
 * file matches the checksum, in case some kind of corruption happened. This
 * could happen if an older version of `jest-runtime` writes non-atomically to
 * the same cache, for example.
 */
function readCodeCacheFile(cachePath: Path): ?string {
  const content = readCacheFile(cachePath);
  if (content == null) {
    return null;
  }
  const code = content.substr(33);
  const checksum = crypto.createHash('md5').update(code).digest('hex');
  if (checksum === content.substr(0, 32)) {
    return code;
  }
  return null;
}

/**
 * Writing to the cache atomically relies on 'rename' being atomic on most
 * file systems. Doing atomic write reduces the risk of corruption by avoiding
 * two processes to write to the same file at the same time. It also reduces
 * the risk of reading a file that's being overwritten at the same time.
 */
const writeCacheFile = (cachePath: Path, fileData: string) => {
  try {
    writeFileAtomic.sync(cachePath, fileData, {encoding: 'utf8'});
  } catch (e) {
    e.message =
      'jest: failed to cache transform results in: ' +
      cachePath +
      '\nFailure message: ' +
      e.message;
    removeFile(cachePath);
    throw e;
  }
};

const readCacheFile = (cachePath: Path): ?string => {
  if (!fs.existsSync(cachePath)) {
    return null;
  }

  let fileData;
  try {
    fileData = fs.readFileSync(cachePath, 'utf8');
  } catch (e) {
    e.message =
      'jest: failed to read cache file: ' +
      cachePath +
      '\nFailure message: ' +
      e.message;
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

const getScriptCacheKey = (filename, config, instrument: boolean) => {
  const mtime = fs.statSync(filename).mtime;
  return filename + '_' + mtime.getTime() + (instrument ? '_instrumented' : '');
};

const shouldTransform = (filename: Path, config: ProjectConfig): boolean => {
  if (!ignoreCache.has(config)) {
    if (
      !config.transformIgnorePatterns ||
      config.transformIgnorePatterns.length === 0
    ) {
      ignoreCache.set(config, null);
    } else {
      ignoreCache.set(
        config,
        new RegExp(config.transformIgnorePatterns.join('|')),
      );
    }
  }

  const ignoreRegexp = ignoreCache.get(config);
  const isIgnored = ignoreRegexp ? ignoreRegexp.test(filename) : false;
  return !!config.transform && !!config.transform.length && !isIgnored;
};

const wrap = content =>
  '({"' +
  ScriptTransformer.EVAL_RESULT_VARIABLE +
  '":function(module,exports,require,__dirname,__filename,global,jest){' +
  content +
  '\n}});';

ScriptTransformer.EVAL_RESULT_VARIABLE = 'Object.<anonymous>';

module.exports = ScriptTransformer;
