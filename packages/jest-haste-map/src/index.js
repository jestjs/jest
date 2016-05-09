 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const H = require('./constants');

const crypto = require('crypto');
const execSync = require('child_process').execSync;
const fs = require('graceful-fs');
const getPlatformExtension = require('./lib/getPlatformExtension');
const nodeCrawl = require('./crawlers/node');
const os = require('os');
const path = require('./fastpath');
const watchmanCrawl = require('./crawlers/watchman');
const worker = require('./worker');
const workerFarm = require('worker-farm');

const NODE_MODULES = path.sep + 'node_modules' + path.sep;
const VERSION = require('../package.json').version;

const canUseWatchman = (() => {
  try {
    execSync('watchman version', {stdio: 'ignore'});
    return true;
  } catch (e) {}
  return false;
})();

/**
 * HasteMap is a JavaScript implementation of Facebook's haste module system.
 *
 * This implementation is inspired by https://github.com/facebook/node-haste
 * and was built with for high-performance in large code repositories with
 * hundreds of thousands of files. This implementation is scalable and provides
 * predictable performance.
 *
 * Because the haste map creation and synchronization is critical to startup
 * performance and most tasks are blocked by I/O this class makes heavy use of
 * synchronous operations. It uses worker processes for parallelizing file
 * access and metadata extraction.
 *
 * The data structures created by `jest-haste-map` can be used directly from the
 * cache without further processing. The metadata objects in the `files` and
 * `map` objects contain cross-references: a metadata object from one can look
 * up the corresponding metadata object in the other map. Note that in most
 * projects, the number of files will be greater than the number of haste
 * modules one module can refer to many files based on platform extensions.
 *
 * type HasteMap = {
 *   clocks: WatchmanClocks,
 *   files: {[filepath: string]: FileMetaData},
 *   map: {[id: string]: ModuleMap},
 *   mocks: {[id: string]: string},
 * }
 *
 * // Watchman clocks are used for query synchronization and file system deltas.
 * type WatchmanClocks = {[filepath: string]: string};
 *
 * type FileMetaData = {
 *   id: ?string, // used to look up module metadata objects in `map`.
 *   mtime: number, // check for outdated files.
 *   visited: boolean, // whether the file has been parsed or not.
 *   dependencies: Array<string>, // all relative dependencies of this file.
 * };
 *
 * // Modules can be targeted to a specific platform based on the file name.
 * // Example: Platform.ios.js and Platform.android.js will both map to the same
 * // `Platform` module. The platform should be specified during resolution.
 * type ModuleMap = {[platform: string]: ModuleMetaData};
 *
 * //
 * type ModuleMetaData = {
 *   path: string, // the path to look up the file object in `files`.
 *   type: string, // the module type (either `package` or `module`).
 * };
 *
 * Note that the data structures described above are conceptual only. The actual
 * implementation uses arrays and constant keys for metadata storage. Instead of
 * `{id: 'flatMap', mtime: 3421, visited: true, dependencies: []}` the real
 * representation is similar to `['flatMap', 3421, 1, []]` to save storage space
 * and reduce parse and write time of a big JSON blob.
 *
 * The HasteMap is created as follows:
 *  1. read data from the cache or create an empty structure.
 *  2. crawl the file system.
 *     * empty cache: crawl the entire file system.
 *     * cache available:
 *       * if watchman is available: get file system delta changes.
 *       * if watchman is unavailable: crawl the entire file system.
 *     * build metadata objects for every file. This builds the `files` part of
 *       the `HasteMap`.
 *  3. parse and extract metadata from changed files.
 *     * this is done in parallel over worker processes to improve performance.
 *     * the worst case is to parse all files.
 *     * the best case is no file system access and retrieving all data from
 *       the cache.
 *    * the average case is a small number of changed files.
 *  4. serialize the new `HasteMap` in a cache file.
 *     Worker processes can directly access the cache through `HasteMap.read()`.
 *
 */
class HasteMap {

  constructor(options) {
    this._options = {
      cacheDirectory: options.cacheDirectory || os.tmpDir(),
      extensions: options.extensions,
      ignorePattern: options.ignorePattern,
      maxWorkers: options.maxWorkers,
      mocksPattern:
        options.mocksPattern ? new RegExp(options.mocksPattern) : null,
      name: options.name,
      platforms: options.platforms,
      resetCache: options.resetCache,
      roots: options.roots,
      useWatchman:
        options.useWatchman === undefined ? true : options.useWatchman,
    };

    const list = options.providesModuleNodeModules;
    this._whitelist = (list && list.length)
      ? new RegExp('(' + NODE_MODULES + '(?:' + list.join('|') + '))', 'g')
      : null;

    this._cachePath = HasteMap.getCacheFilePath(
      this._options.cacheDirectory,
      this._options.name,
      VERSION,
      this._options.roots.join(':'),
      this._options.extensions.join(':'),
      this._options.platforms.join(':'),
      options.mocksPattern
    );
    this._buildPromise = null;
    this._workerPromise = null;
    this._workerFarm = null;
  }

  static getCacheFilePath(tmpdir, name) {
    const hash = crypto.createHash('md5');
    Array.from(arguments).slice(1).forEach(arg => hash.update(arg));
    return path.join(
      tmpdir,
      name.replace(/\W/g, '-') + '-' + hash.digest('hex')
    );
  }

  build() {
    if (!this._buildPromise) {
      this._buildPromise = this._buildFileMap()
        .then(fileMap => this._buildHasteMap(fileMap))
        .then(hasteMap => this._persist(hasteMap));
    }
    return this._buildPromise;
  }

  /**
   * Matches all files against a pattern.
   */
  matchFiles(pattern) {
    if (!(pattern instanceof RegExp)) {
      pattern = new RegExp(pattern);
    }
    return this.build().then(hasteMap => {
      const files = [];
      for (const file in hasteMap.files) {
        if (pattern.test(file)) {
          files.push(file);
        }
      }
      return files;
    });
  }

  /**
   * 1. read data from the cache or create an empty structure.
   */
  read() {
    return this._parse(fs.readFileSync(this._cachePath, 'utf-8'));
  }

  /**
   * 2. crawl the file system.
   */
  _buildFileMap() {
    const read = this._options.resetCache ? this._createEmptyMap : this.read;

    return Promise.resolve()
      .then(() => read.call(this))
      .catch(() => this._createEmptyMap())
      .then(hasteMap => this._crawl(hasteMap));
  }

  /**
   * 3. parse and extract metadata from changed files.
   */
  _buildHasteMap(hasteMap) {
    const map = Object.create(null);
    const mocks = Object.create(null);
    const mocksPattern = this._options.mocksPattern;
    const promises = [];
    const setModule = (id, module) => {
      if (!map[id]) {
        map[id] = Object.create(null);
      }
      const moduleMap = map[id];
      const platform =
        getPlatformExtension(module[H.PATH]) || H.GENERIC_PLATFORM;
      const existingModule = moduleMap[platform];
      if (existingModule && existingModule[H.PATH] !== module[H.PATH]) {
        console.warn(
          `jest-haste-map: @providesModule naming collision:\n` +
          `  Duplicate module name: ${id}\n` +
          `  Paths: ${module[H.PATH]} collides with ` +
          `${existingModule[H.PATH]}\n\n` +
          `This warning is caused by a @providesModule declaration ` +
          `with the same name accross two different files.`
        );
        return;
      }

      moduleMap[platform] = module;
    };

    for (const filePath in hasteMap.files) {
      if (mocksPattern && mocksPattern.test(filePath)) {
        mocks[path.basename(filePath, path.extname(filePath))] = filePath;
      }

      const fileMetadata = hasteMap.files[filePath];
      const moduleMetadata = hasteMap.map[fileMetadata[H.ID]];
      if (fileMetadata[H.VISITED]) {
        if (!fileMetadata[H.ID]) {
          continue;
        } else if (fileMetadata[H.ID] && moduleMetadata) {
          map[fileMetadata[H.ID]] = moduleMetadata;
          continue;
        }
      }

      promises.push(
        this._getWorker()({filePath}).then(
          metadata => {
            // `1` for truthy values instead of `true` to save cache space.
            fileMetadata[H.VISITED] = 1;
            if (metadata.id) {
              fileMetadata[H.ID] = metadata.id;
              setModule(metadata.id, metadata.module);
            }
            fileMetadata[H.DEPENDENCIES] = metadata.dependencies || [];
          },
          error => {
            // If a file cannot be read we remove it from the file list and
            // ignore the failure silently.
            delete hasteMap.files[filePath];
          }
        )
      );
    }

    return Promise.all(promises)
      .then(() => {
        if (this._workerFarm) {
          workerFarm.end(this._workerFarm);
        }
        this._workerFarm = null;
        this._workerPromise = null;
      })
      .then(() => {
        hasteMap.map = map;
        hasteMap.mocks = mocks;
        return hasteMap;
      });
  }

  /**
   * 4. serialize the new `HasteMap` in a cache file.
   */
  _persist(hasteMap) {
    fs.writeFileSync(this._cachePath, JSON.stringify(hasteMap), 'utf-8');
    return hasteMap;
  }

  /**
   * Creates workers or parses files and extracts metadata in-process.
   */
  _getWorker() {
    if (!this._workerPromise) {
      let workerFn;
      if (this._options.maxWorkers <= 1) {
        workerFn = worker;
      } else {
        this._workerFarm = workerFarm(
          {
            maxConcurrentWorkers: this._options.maxWorkers,
          },
          require.resolve('./worker')
        );
        workerFn = this._workerFarm;
      }

      this._workerPromise = message => new Promise(
        (resolve, reject) => workerFn(message, (error, metadata) => {
          if (error) {
            reject(error);
          } else {
            resolve(metadata);
          }
        })
      );
    }

    return this._workerPromise;
  }

  _parse(hasteMap) {
    hasteMap = JSON.parse(hasteMap);
    for (const key in hasteMap) {
      Object.setPrototypeOf(hasteMap[key], null);
    }
    return hasteMap;
  }

  _crawl(hasteMap) {
    const options = this._options;
    const ignore = this._ignore.bind(this);
    const crawl =
      (canUseWatchman && this._options.useWatchman) ? watchmanCrawl : nodeCrawl;

    const retry = error => {
      if (crawl === watchmanCrawl) {
        console.warn(
          `jest-haste-map: Watchman crawl failed. Retrying once with node ` +
          `crawler.\n  ${error}`
        );
        return nodeCrawl(options.roots, options.extensions, ignore, hasteMap)
          .catch(e => {
            throw new Error(
              `Crawler retry failed:\n` +
              `  Original error: ${error.message}\n` +
              `  Retry error: ${e.message}\n`
            );
          });
      }

      throw error;
    };

    try {
      return crawl(options.roots, options.extensions, ignore, hasteMap)
        .catch(retry);
    } catch (error) {
      return retry(error);
    }
  }

  _ignore(filePath) {
    return (
      this._options.ignorePattern.test(filePath) ||
      this._isNodeModulesDir(filePath)
    );
  }

  _isNodeModulesDir(filePath) {
    if (!filePath.includes(NODE_MODULES)) {
      return false;
    }

    if (this._whitelist) {
      const match = filePath.match(this._whitelist);
      return !match || match.length > 1;
    }

    return true;
  }

  _createEmptyMap() {
    return {
      clocks: Object.create(null),
      files: Object.create(null),
      map: Object.create(null),
      mocks: Object.create(null),
    };
  }

}

HasteMap.H = H;
HasteMap.fastpath = path;

module.exports = HasteMap;
