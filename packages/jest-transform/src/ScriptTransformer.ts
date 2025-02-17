/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createHash} from 'crypto';
import * as path from 'path';
import {transformSync as babelTransform} from '@babel/core';
// @ts-expect-error: should just be `require.resolve`, but the tests mess that up
import babelPluginIstanbul from 'babel-plugin-istanbul';
import {fromSource as sourcemapFromSource} from 'convert-source-map';
import stableStringify = require('fast-json-stable-stringify');
import * as fs from 'graceful-fs';
import {addHook} from 'pirates';
import slash = require('slash');
import {sync as writeFileAtomic} from 'write-file-atomic';
import type {Config} from '@jest/types';
import HasteMap from 'jest-haste-map';
import {
  createDirectory,
  invariant,
  isPromise,
  requireOrImportModule,
  tryRealpath,
} from 'jest-util';
import handlePotentialSyntaxError from './enhanceUnexpectedTokenMessage';
import {
  makeInvalidReturnValueError,
  makeInvalidSourceMapWarning,
  makeInvalidSyncTransformerError,
  makeInvalidTransformerError,
} from './runtimeErrorsAndWarnings';
import shouldInstrument from './shouldInstrument';
import type {
  FixedRawSourceMap,
  Options,
  ReducedTransformOptions,
  RequireAndTranspileModuleOptions,
  StringMap,
  SyncTransformer,
  TransformOptions,
  TransformResult,
  TransformedSource,
  Transformer,
  TransformerFactory,
} from './types';
// Use `require` to avoid TS rootDir
const {version: VERSION} = require('../package.json') as {version: string};

type ProjectCache = {
  configString: string;
  ignorePatternsRegExp?: RegExp;
  transformRegExp?: Array<[RegExp, string, Record<string, unknown>]>;
  transformedFiles: Map<string, TransformResult>;
};

// This data structure is used to avoid recalculating some data every time that
// we need to transform a file. Since ScriptTransformer is instantiated for each
// file we need to keep this object in the local scope of this module.
const projectCaches = new Map<string, ProjectCache>();

// To reset the cache for specific changesets (rather than package version).
const CACHE_VERSION = '1';

async function waitForPromiseWithCleanup(
  promise: Promise<unknown>,
  cleanup: () => void,
) {
  try {
    await promise;
  } finally {
    cleanup();
  }
}

// type predicate
function isTransformerFactory<X extends Transformer>(
  t: Transformer | TransformerFactory<X>,
): t is TransformerFactory<X> {
  return typeof (t as TransformerFactory<X>).createTransformer === 'function';
}

class ScriptTransformer {
  private readonly _cache: ProjectCache;
  private readonly _transformCache = new Map<
    string,
    {transformer: Transformer; transformerConfig: unknown}
  >();
  private _transformsAreLoaded = false;

  constructor(
    private readonly _config: Config.ProjectConfig,
    private readonly _cacheFS: StringMap,
  ) {
    const configString = stableStringify(this._config);
    let projectCache = projectCaches.get(configString);

    if (!projectCache) {
      projectCache = {
        configString,
        ignorePatternsRegExp: calcIgnorePatternRegExp(this._config),
        transformRegExp: calcTransformRegExp(this._config),
        transformedFiles: new Map(),
      };

      projectCaches.set(configString, projectCache);
    }

    this._cache = projectCache;
  }

  private _buildCacheKeyFromFileInfo(
    fileData: string,
    filename: string,
    transformOptions: TransformOptions,
    transformerCacheKey: string | undefined,
  ): string {
    if (transformerCacheKey != null) {
      return createHash('sha1')
        .update(transformerCacheKey)
        .update(CACHE_VERSION)
        .digest('hex')
        .slice(0, 32);
    }

    return createHash('sha1')
      .update(fileData)
      .update(transformOptions.configString)
      .update(transformOptions.instrument ? 'instrument' : '')
      .update(filename)
      .update(CACHE_VERSION)
      .digest('hex')
      .slice(0, 32);
  }

  private _buildTransformCacheKey(pattern: string, filepath: string) {
    return pattern + filepath;
  }

  private _getCacheKey(
    fileData: string,
    filename: string,
    options: ReducedTransformOptions,
  ): string {
    const configString = this._cache.configString;
    const {transformer, transformerConfig = {}} =
      this._getTransformer(filename) ?? {};
    let transformerCacheKey = undefined;

    const transformOptions: TransformOptions = {
      ...options,
      cacheFS: this._cacheFS,
      config: this._config,
      configString,
      transformerConfig,
    };

    if (typeof transformer?.getCacheKey === 'function') {
      transformerCacheKey = transformer.getCacheKey(
        fileData,
        filename,
        transformOptions,
      );
    }

    return this._buildCacheKeyFromFileInfo(
      fileData,
      filename,
      transformOptions,
      transformerCacheKey,
    );
  }

  private async _getCacheKeyAsync(
    fileData: string,
    filename: string,
    options: ReducedTransformOptions,
  ): Promise<string> {
    const configString = this._cache.configString;
    const {transformer, transformerConfig = {}} =
      this._getTransformer(filename) ?? {};
    let transformerCacheKey = undefined;

    const transformOptions: TransformOptions = {
      ...options,
      cacheFS: this._cacheFS,
      config: this._config,
      configString,
      transformerConfig,
    };

    if (transformer) {
      const getCacheKey =
        transformer.getCacheKeyAsync ?? transformer.getCacheKey;

      if (typeof getCacheKey === 'function') {
        transformerCacheKey = await getCacheKey(
          fileData,
          filename,
          transformOptions,
        );
      }
    }

    return this._buildCacheKeyFromFileInfo(
      fileData,
      filename,
      transformOptions,
      transformerCacheKey,
    );
  }

  private _createCachedFilename(filename: string, cacheKey: string): string {
    const HasteMapClass = HasteMap.getStatic(this._config);
    const baseCacheDir = HasteMapClass.getCacheFilePath(
      this._config.cacheDirectory,
      `jest-transform-cache-${this._config.id}`,
      VERSION,
    );
    // Create sub folders based on the cacheKey to avoid creating one
    // directory with many files.
    const cacheDir = path.join(baseCacheDir, cacheKey[0] + cacheKey[1]);
    const cacheFilenamePrefix = path
      .basename(filename, path.extname(filename))
      .replaceAll(/\W/g, '');
    return slash(path.join(cacheDir, `${cacheFilenamePrefix}_${cacheKey}`));
  }

  private _getFileCachePath(
    filename: string,
    content: string,
    options: ReducedTransformOptions,
  ): string {
    const cacheKey = this._getCacheKey(content, filename, options);

    return this._createCachedFilename(filename, cacheKey);
  }

  private async _getFileCachePathAsync(
    filename: string,
    content: string,
    options: ReducedTransformOptions,
  ): Promise<string> {
    const cacheKey = await this._getCacheKeyAsync(content, filename, options);

    return this._createCachedFilename(filename, cacheKey);
  }

  private _getTransformPatternAndPath(filename: string) {
    const transformEntry = this._cache.transformRegExp;
    if (transformEntry == null) {
      return undefined;
    }

    for (const item of transformEntry) {
      const [transformRegExp, transformPath] = item;
      if (transformRegExp.test(filename)) {
        return [transformRegExp.source, transformPath];
      }
    }

    return undefined;
  }

  private _getTransformPath(filename: string) {
    const transformInfo = this._getTransformPatternAndPath(filename);
    if (!Array.isArray(transformInfo)) {
      return undefined;
    }

    return transformInfo[1];
  }

  async loadTransformers(): Promise<void> {
    await Promise.all(
      this._config.transform.map(
        async ([transformPattern, transformPath, transformerConfig], i) => {
          let transformer: Transformer | TransformerFactory<Transformer> =
            await requireOrImportModule(transformPath);

          if (transformer == null) {
            throw new Error(makeInvalidTransformerError(transformPath));
          }
          if (isTransformerFactory(transformer)) {
            transformer =
              await transformer.createTransformer(transformerConfig);
          }
          if (
            typeof transformer.process !== 'function' &&
            typeof transformer.processAsync !== 'function'
          ) {
            throw new TypeError(makeInvalidTransformerError(transformPath));
          }
          const res = {transformer, transformerConfig};
          const transformCacheKey = this._buildTransformCacheKey(
            this._cache.transformRegExp?.[i]?.[0].source ??
              new RegExp(transformPattern).source,
            transformPath,
          );
          this._transformCache.set(transformCacheKey, res);
        },
      ),
    );

    this._transformsAreLoaded = true;
  }

  private _getTransformer(filename: string) {
    if (!this._transformsAreLoaded) {
      throw new Error(
        'Jest: Transformers have not been loaded yet - make sure to run `loadTransformers` and wait for it to complete before starting to transform files',
      );
    }

    if (this._config.transform.length === 0) {
      return null;
    }

    const transformPatternAndPath = this._getTransformPatternAndPath(filename);
    if (!Array.isArray(transformPatternAndPath)) {
      return null;
    }

    const [transformPattern, transformPath] = transformPatternAndPath;
    const transformCacheKey = this._buildTransformCacheKey(
      transformPattern,
      transformPath,
    );
    const transformer = this._transformCache.get(transformCacheKey);
    if (transformer !== undefined) {
      return transformer;
    }

    throw new Error(
      `Jest was unable to load the transformer defined for ${filename}. This is a bug in Jest, please open up an issue`,
    );
  }

  private _instrumentFile(
    filename: string,
    input: TransformedSource,
    canMapToInput: boolean,
    options: ReducedTransformOptions,
  ): TransformedSource {
    const inputCode = typeof input === 'string' ? input : input.code;
    const inputMap = typeof input === 'string' ? null : input.map;

    const result = babelTransform(inputCode, {
      auxiliaryCommentBefore: ' istanbul ignore next ',
      babelrc: false,
      caller: {
        name: '@jest/transform',
        supportsDynamicImport: options.supportsDynamicImport,
        supportsExportNamespaceFrom: options.supportsExportNamespaceFrom,
        supportsStaticESM: options.supportsStaticESM,
        supportsTopLevelAwait: options.supportsTopLevelAwait,
      },
      configFile: false,
      filename,
      plugins: [
        [
          babelPluginIstanbul,
          {
            compact: false,
            // files outside `cwd` will not be instrumented
            cwd: this._config.rootDir,
            exclude: [],
            extension: false,
            inputSourceMap: inputMap,
            useInlineSourceMaps: false,
          },
        ],
      ],
      sourceMaps: canMapToInput ? 'both' : false,
    });

    if (result?.code != null) {
      return result as TransformResult;
    }

    return input;
  }

  private _buildTransformResult(
    filename: string,
    cacheFilePath: string,
    content: string,
    transformer: Transformer | undefined,
    shouldCallTransform: boolean,
    options: ReducedTransformOptions,
    processed: TransformedSource | null,
    sourceMapPath: string | null,
  ): TransformResult {
    let transformed: TransformedSource = {
      code: content,
      map: null,
    };

    if (transformer && shouldCallTransform) {
      if (processed != null && typeof processed.code === 'string') {
        transformed = processed;
      } else {
        const transformPath = this._getTransformPath(filename);
        invariant(transformPath);
        throw new Error(makeInvalidReturnValueError(transformPath));
      }
    }

    if (transformed.map == null || transformed.map === '') {
      try {
        //Could be a potential freeze here.
        //See: https://github.com/jestjs/jest/pull/5177#discussion_r158883570
        const inlineSourceMap = sourcemapFromSource(transformed.code);
        if (inlineSourceMap) {
          transformed.map = inlineSourceMap.toObject() as FixedRawSourceMap;
        }
      } catch {
        const transformPath = this._getTransformPath(filename);
        invariant(transformPath);
        console.warn(makeInvalidSourceMapWarning(filename, transformPath));
      }
    }

    // That means that the transform has a custom instrumentation
    // logic and will handle it based on `config.collectCoverage` option
    const transformWillInstrument =
      shouldCallTransform && transformer && transformer.canInstrument;

    // Apply instrumentation to the code if necessary, keeping the instrumented code and new map
    let map = transformed.map;
    let code;
    if (transformWillInstrument !== true && options.instrument) {
      /**
       * We can map the original source code to the instrumented code ONLY if
       * - the process of transforming the code produced a source map e.g. ts-jest
       * - we did not transform the source code
       *
       * Otherwise we cannot make any statements about how the instrumented code corresponds to the original code,
       * and we should NOT emit any source maps
       *
       */
      const shouldEmitSourceMaps =
        (transformer != null && map != null) || transformer == null;

      const instrumented = this._instrumentFile(
        filename,
        transformed,
        shouldEmitSourceMaps,
        options,
      );

      code =
        typeof instrumented === 'string' ? instrumented : instrumented.code;
      map = typeof instrumented === 'string' ? null : instrumented.map;
    } else {
      code = transformed.code;
    }

    if (map == null) {
      sourceMapPath = null;
    } else {
      const sourceMapContent =
        typeof map === 'string' ? map : JSON.stringify(map);

      invariant(sourceMapPath, 'We should always have default sourceMapPath');

      writeCacheFile(sourceMapPath, sourceMapContent);
    }

    writeCodeCacheFile(cacheFilePath, code);

    return {
      code,
      originalCode: content,
      sourceMapPath,
    };
  }

  transformSource(
    filepath: string,
    content: string,
    options: ReducedTransformOptions,
  ): TransformResult {
    const filename = tryRealpath(filepath);
    const {transformer, transformerConfig = {}} =
      this._getTransformer(filename) ?? {};
    const cacheFilePath = this._getFileCachePath(filename, content, options);
    const sourceMapPath = `${cacheFilePath}.map`;
    // Ignore cache if `config.cache` is set (--no-cache)
    const code = this._config.cache ? readCodeCacheFile(cacheFilePath) : null;

    if (code != null) {
      // This is broken: we return the code, and a path for the source map
      // directly from the cache. But, nothing ensures the source map actually
      // matches that source code. They could have gotten out-of-sync in case
      // two separate processes write concurrently to the same cache files.
      return {
        code,
        originalCode: content,
        sourceMapPath,
      };
    }

    let processed: TransformedSource | null = null;

    let shouldCallTransform = false;

    if (transformer && this.shouldTransform(filename)) {
      shouldCallTransform = true;

      assertSyncTransformer(transformer, this._getTransformPath(filename));

      processed = transformer.process(content, filename, {
        ...options,
        cacheFS: this._cacheFS,
        config: this._config,
        configString: this._cache.configString,
        transformerConfig,
      });
    }

    createDirectory(path.dirname(cacheFilePath));
    return this._buildTransformResult(
      filename,
      cacheFilePath,
      content,
      transformer,
      shouldCallTransform,
      options,
      processed,
      sourceMapPath,
    );
  }

  async transformSourceAsync(
    filepath: string,
    content: string,
    options: ReducedTransformOptions,
  ): Promise<TransformResult> {
    const filename = tryRealpath(filepath);
    const {transformer, transformerConfig = {}} =
      this._getTransformer(filename) ?? {};
    const cacheFilePath = await this._getFileCachePathAsync(
      filename,
      content,
      options,
    );
    const sourceMapPath = `${cacheFilePath}.map`;
    // Ignore cache if `config.cache` is set (--no-cache)
    const code = this._config.cache ? readCodeCacheFile(cacheFilePath) : null;

    if (code != null) {
      // This is broken: we return the code, and a path for the source map
      // directly from the cache. But, nothing ensures the source map actually
      // matches that source code. They could have gotten out-of-sync in case
      // two separate processes write concurrently to the same cache files.
      return {
        code,
        originalCode: content,
        sourceMapPath,
      };
    }

    let processed = null;

    let shouldCallTransform = false;

    if (transformer && this.shouldTransform(filename)) {
      shouldCallTransform = true;
      const process = transformer.processAsync ?? transformer.process;

      // This is probably dead code since `_getTransformerAsync` already asserts this
      invariant(
        typeof process === 'function',
        'A transformer must always export either a `process` or `processAsync`',
      );

      processed = await process(content, filename, {
        ...options,
        cacheFS: this._cacheFS,
        config: this._config,
        configString: this._cache.configString,
        transformerConfig,
      });
    }

    createDirectory(path.dirname(cacheFilePath));
    return this._buildTransformResult(
      filename,
      cacheFilePath,
      content,
      transformer,
      shouldCallTransform,
      options,
      processed,
      sourceMapPath,
    );
  }

  private async _transformAndBuildScriptAsync(
    filename: string,
    options: Options,
    transformOptions: ReducedTransformOptions,
    fileSource?: string,
  ): Promise<TransformResult> {
    const {isInternalModule} = options;
    let fileContent = fileSource ?? this._cacheFS.get(filename);
    if (fileContent == null) {
      fileContent = fs.readFileSync(filename, 'utf8');
      this._cacheFS.set(filename, fileContent);
    }
    const content = stripShebang(fileContent);

    let code = content;
    let sourceMapPath: string | null = null;

    const willTransform =
      isInternalModule !== true &&
      (transformOptions.instrument || this.shouldTransform(filename));

    try {
      if (willTransform) {
        const transformedSource = await this.transformSourceAsync(
          filename,
          content,
          transformOptions,
        );

        code = transformedSource.code;
        sourceMapPath = transformedSource.sourceMapPath;
      }

      return {
        code,
        originalCode: content,
        sourceMapPath,
      };
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      throw handlePotentialSyntaxError(error);
    }
  }

  private _transformAndBuildScript(
    filename: string,
    options: Options,
    transformOptions: ReducedTransformOptions,
    fileSource?: string,
  ): TransformResult {
    const {isInternalModule} = options;
    let fileContent = fileSource ?? this._cacheFS.get(filename);
    if (fileContent == null) {
      fileContent = fs.readFileSync(filename, 'utf8');
      this._cacheFS.set(filename, fileContent);
    }
    const content = stripShebang(fileContent);

    let code = content;
    let sourceMapPath: string | null = null;

    const willTransform =
      isInternalModule !== true &&
      (transformOptions.instrument || this.shouldTransform(filename));

    try {
      if (willTransform) {
        const transformedSource = this.transformSource(
          filename,
          content,
          transformOptions,
        );

        code = transformedSource.code;
        sourceMapPath = transformedSource.sourceMapPath;
      }

      return {
        code,
        originalCode: content,
        sourceMapPath,
      };
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      throw handlePotentialSyntaxError(error);
    }
  }

  async transformAsync(
    filename: string,
    options: Options,
    fileSource?: string,
  ): Promise<TransformResult> {
    const instrument =
      options.coverageProvider === 'babel' &&
      shouldInstrument(filename, options, this._config);
    const scriptCacheKey = getScriptCacheKey(filename, instrument);
    let result = this._cache.transformedFiles.get(scriptCacheKey);
    if (result) {
      return result;
    }

    result = await this._transformAndBuildScriptAsync(
      filename,
      options,
      {...options, instrument},
      fileSource,
    );

    if (scriptCacheKey) {
      this._cache.transformedFiles.set(scriptCacheKey, result);
    }

    return result;
  }

  transform(
    filename: string,
    options: Options,
    fileSource?: string,
  ): TransformResult {
    const instrument =
      options.coverageProvider === 'babel' &&
      shouldInstrument(filename, options, this._config);
    const scriptCacheKey = getScriptCacheKey(filename, instrument);

    let result = this._cache.transformedFiles.get(scriptCacheKey);
    if (result) {
      return result;
    }

    result = this._transformAndBuildScript(
      filename,
      options,
      {...options, instrument},
      fileSource,
    );

    if (scriptCacheKey) {
      this._cache.transformedFiles.set(scriptCacheKey, result);
    }

    return result;
  }

  transformJson(
    filename: string,
    options: Options,
    fileSource: string,
  ): string {
    const {isInternalModule} = options;
    const willTransform =
      isInternalModule !== true && this.shouldTransform(filename);

    if (willTransform) {
      const {code: transformedJsonSource} = this.transformSource(
        filename,
        fileSource,
        {...options, instrument: false},
      );
      return transformedJsonSource;
    }

    return fileSource;
  }

  async requireAndTranspileModule<ModuleType = unknown>(
    moduleName: string,
    callback?: (module: ModuleType) => void | Promise<void>,
    options?: RequireAndTranspileModuleOptions,
  ): Promise<ModuleType> {
    options = {
      applyInteropRequireDefault: true,
      instrument: false,
      supportsDynamicImport: false,
      supportsExportNamespaceFrom: false,
      supportsStaticESM: false,
      supportsTopLevelAwait: false,
      ...options,
    };
    let transforming = false;
    const {applyInteropRequireDefault, ...transformOptions} = options;
    const revertHook = addHook(
      (code, filename) => {
        try {
          transforming = true;
          return (
            this.transformSource(filename, code, transformOptions).code || code
          );
        } finally {
          transforming = false;
        }
      },
      {
        // Exclude `mjs` extension when addHook because pirates don't support hijack es module
        exts: this._config.moduleFileExtensions
          .filter(ext => ext !== 'mjs')
          .map(ext => `.${ext}`),
        ignoreNodeModules: false,
        matcher: filename => {
          if (transforming) {
            // Don't transform any dependency required by the transformer itself
            return false;
          }
          return this.shouldTransform(filename);
        },
      },
    );
    try {
      const module: ModuleType = await requireOrImportModule(
        moduleName,
        applyInteropRequireDefault,
      );

      if (!callback) {
        revertHook();

        return module;
      }

      const cbResult = callback(module);

      if (isPromise(cbResult)) {
        return await waitForPromiseWithCleanup(cbResult, revertHook).then(
          () => module,
        );
      }

      return module;
    } finally {
      revertHook();
    }
  }

  shouldTransform(filename: string): boolean {
    const ignoreRegexp = this._cache.ignorePatternsRegExp;
    const isIgnored = ignoreRegexp ? ignoreRegexp.test(filename) : false;

    return this._config.transform.length > 0 && !isIgnored;
  }
}

// TODO: do we need to define the generics twice?
export async function createTranspilingRequire(
  config: Config.ProjectConfig,
): Promise<
  <TModuleType = unknown>(
    resolverPath: string,
    applyInteropRequireDefault?: boolean,
  ) => Promise<TModuleType>
> {
  const transformer = await createScriptTransformer(config);

  return async function requireAndTranspileModule<TModuleType = unknown>(
    resolverPath: string,
    applyInteropRequireDefault = false,
  ) {
    const transpiledModule =
      await transformer.requireAndTranspileModule<TModuleType>(
        resolverPath,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
        {
          applyInteropRequireDefault,
          instrument: false,
          supportsDynamicImport: false, // this might be true, depending on node version.
          supportsExportNamespaceFrom: false,
          supportsStaticESM: false,
          supportsTopLevelAwait: false,
        },
      );

    return transpiledModule;
  };
}

const removeFile = (path: string) => {
  try {
    fs.unlinkSync(path);
  } catch {}
};

const stripShebang = (content: string) => {
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
function writeCodeCacheFile(cachePath: string, code: string) {
  const checksum = createHash('sha1').update(code).digest('hex').slice(0, 32);
  writeCacheFile(cachePath, `${checksum}\n${code}`);
}

/**
 * Read counterpart of `writeCodeCacheFile`. We verify that the content of the
 * file matches the checksum, in case some kind of corruption happened. This
 * could happen if an older version of `jest-runtime` writes non-atomically to
 * the same cache, for example.
 */
function readCodeCacheFile(cachePath: string): string | null {
  const content = readCacheFile(cachePath);
  if (content == null) {
    return null;
  }
  const code = content.slice(33);
  const checksum = createHash('sha1').update(code).digest('hex').slice(0, 32);
  if (checksum === content.slice(0, 32)) {
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
const writeCacheFile = (cachePath: string, fileData: string) => {
  try {
    writeFileAtomic(cachePath, fileData, {encoding: 'utf8', fsync: false});
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }
    if (cacheWriteErrorSafeToIgnore(error, cachePath)) {
      return;
    }

    error.message = `jest: failed to cache transform results in: ${cachePath}\nFailure message: ${error.message}`;
    removeFile(cachePath);
    throw error;
  }
};

/**
 * On Windows, renames are not atomic, leading to EPERM exceptions when two
 * processes attempt to rename to the same target file at the same time.
 * If the target file exists we can be reasonably sure another process has
 * legitimately won a cache write race and ignore the error.
 * If the target does not exist we do not know if it is because it is still
 * being written by another process or is being overwritten by another process.
 */
const cacheWriteErrorSafeToIgnore = (
  e: NodeJS.ErrnoException,
  cachePath: string,
) => {
  if (process.platform !== 'win32' || e.code !== 'EPERM') {
    return false;
  }
  if (!fs.existsSync(cachePath)) {
    console.warn('Possible problem writing cache if this occurs many times', e);
  }
  return true;
};

const readCacheFile = (cachePath: string): string | null => {
  if (!fs.existsSync(cachePath)) {
    return null;
  }

  let fileData;
  try {
    fileData = fs.readFileSync(cachePath, 'utf8');
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }
    // on windows write-file-atomic is not atomic which can
    // result in this error
    if (
      (error as NodeJS.ErrnoException).code === 'ENOENT' &&
      process.platform === 'win32'
    ) {
      return null;
    }

    error.message = `jest: failed to read cache file: ${cachePath}\nFailure message: ${error.message}`;
    removeFile(cachePath);
    throw error;
  }

  if (fileData == null) {
    // We must have somehow created the file but failed to write to it,
    // let's delete it and retry.
    removeFile(cachePath);
  }
  return fileData;
};

const getScriptCacheKey = (filename: string, instrument: boolean) => {
  const mtime = fs.statSync(filename).mtime;
  return `${filename}_${mtime.getTime()}${instrument ? '_instrumented' : ''}`;
};

const calcIgnorePatternRegExp = (config: Config.ProjectConfig) => {
  if (
    config.transformIgnorePatterns == null ||
    config.transformIgnorePatterns.length === 0
  ) {
    return undefined;
  }

  return new RegExp(config.transformIgnorePatterns.join('|'));
};

const calcTransformRegExp = (config: Config.ProjectConfig) => {
  if (config.transform.length === 0) {
    return undefined;
  }

  const transformRegexp: Array<[RegExp, string, Record<string, unknown>]> = [];
  for (const item of config.transform) {
    transformRegexp.push([new RegExp(item[0]), item[1], item[2]]);
  }

  return transformRegexp;
};

function assertSyncTransformer(
  transformer: Transformer,
  name: string | undefined,
): asserts transformer is SyncTransformer {
  invariant(name);
  invariant(
    typeof transformer.process === 'function',
    makeInvalidSyncTransformerError(name),
  );
}

export type TransformerType = ScriptTransformer;

export async function createScriptTransformer(
  config: Config.ProjectConfig,
  cacheFS: StringMap = new Map(),
): Promise<TransformerType> {
  const transformer = new ScriptTransformer(config, cacheFS);

  await transformer.loadTransformers();

  return transformer;
}
