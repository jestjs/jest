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

const crypto = require('crypto');
const path = require('path');
const vm = require('vm');
const {createDirectory} = require('jest-util');
const fs = require('graceful-fs');
const {getCacheFilePath} = require('jest-haste-map');
const stableStringify = require('json-stable-stringify');
const slash = require('slash');

const VERSION = require('../package.json').version;
const shouldInstrument = require('./shouldInstrument');

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
      return transformer.getCacheKey(fileData, filename, configString, {
        instrument,
      });
    } else {
      return crypto
        .createHash('md5')
        .update(fileData)
        .update(configString)
        .update(instrument ? 'instrument' : '')
        .update(mapCoverage ? 'mapCoverage' : '')
        .digest('hex');
    }
  }

  _getFileCachePath(
    filename: Path,
    content: string,
    instrument: boolean,
    mapCoverage: boolean,
  ): Path {
    const baseCacheDir = getCacheFilePath(
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
    // Keeping these requires inside this function reduces a single run
    // time by 2sec if not running in `--coverage` mode
    const babel = require('babel-core');
    const babelPluginIstanbul = require('babel-plugin-istanbul').default;

    return babel.transform(content, {
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
    let code = this._config.cache
      ? readCacheFile(filename, cacheFilePath)
      : null;

    if (code) {
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
      } else {
        transformed = processed;
      }
    }

    if (mapCoverage) {
      if (!transformed.map) {
        const convert = require('convert-source-map');
        const inlineSourceMap = convert.fromSource(transformed.code);
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
      const sourceMapContent = typeof transformed.map === 'string'
        ? transformed.map
        : JSON.stringify(transformed.map);
      writeCacheFile(sourceMapPath, sourceMapContent);
    } else {
      sourceMapPath = null;
    }

    writeCacheFile(cacheFilePath, code);

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

const writeCacheFile = (cachePath: Path, fileData: string) => {
  try {
    fs.writeFileSync(cachePath, fileData, 'utf8');
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

const readCacheFile = (filename: Path, cachePath: Path): ?string => {
  if (!fs.existsSync(cachePath)) {
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
