 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const crypto = require('crypto');
const denodeify = require('denodeify');
const execSync = require('child_process').execSync;
const fs = require('graceful-fs');
const getPlatformExtension = require('./lib/getPlatformExtension');
const nodeCrawl = require('./crawlers/node');
const os = require('os');
const path = require('./fastpath');
const watchmanCrawl = require('./crawlers/watchman');
const worker = require('./worker');
const workerFarm = require('worker-farm');

const GENERIC_PLATFORM = 'g';
const NODE_MODULES = path.sep + 'node_modules' + path.sep;
const VERSION = require('../package.json').version;

const canUseWatchman = (() => {
  try {
    execSync('watchman version', {stdio: 'ignore'});
    return true;
  } catch (e) {}
  return false;
})();

class HasteMap {

  constructor(options) {
    this._options = {
      cacheDirectory: options.cacheDirectory || os.tmpDir(),
      extensions: options.extensions,
      ignorePattern: options.ignorePattern,
      maxWorkers: options.maxWorkers,
      mocksPattern:
        options.mocksPattern ? new RegExp(options.mocksPattern) : null,
      platforms: options.platforms,
      resetCache: options.resetCache,
      roots: options.roots,
      useWatchman:
        options.useWatchman === undefined ? true : options.useWatchman,
    };

    const list = options.providesModuleNodeModules;
    this._whitelist = (list && list.length)
      ? new RegExp('(.+?)' + NODE_MODULES + '(' + list.join('|') + ')(?!' + NODE_MODULES + ')')
      : null;

    this._cachePath = HasteMap.getCacheFilePath(
      this._options.cacheDirectory,
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

  static getCacheFilePath(tmpdir) {
    const hash = crypto.createHash('md5');
    Array.from(arguments).slice(1).forEach(arg => hash.update(arg));
    return path.join(tmpdir, hash.digest('hex'));
  }

  build() {
    if (!this._buildPromise) {
      this._buildPromise = this._buildFileMap()
        .then(data => this._buildHasteMap(data))
        .then(data => this._persist(data));
    }
    return this._buildPromise;
  }

  read() {
    return this._parse(fs.readFileSync(this._cachePath, 'utf-8'));
  }

  matchFiles(pattern) {
    if (!(pattern instanceof RegExp)) {
      pattern = new RegExp(pattern);
    }
    return this.build().then(data => {
      const files = [];
      for (const file in data.files) {
        if (pattern.test(file)) {
          files.push(file);
        }
      }
      return files;
    });
  }

  _persist(data) {
    fs.writeFileSync(this._cachePath, JSON.stringify(data), 'utf-8');
    return data;
  }

  _buildFileMap() {
    const read = this._options.resetCache ? this._createEmptyMap : this.read;

    return Promise.resolve()
      .then(() => read.call(this))
      .catch(() => this._createEmptyMap())
      .then(data => this._crawl(data));
  }

  _buildHasteMap(data) {
    const map = Object.create(null);
    const mocks = Object.create(null);
    const mocksPattern = this._options.mocksPattern;
    const promises = [];
    const setModule = module => {
      if (!map[module.id]) {
        map[module.id] = Object.create(null);
      }
      const moduleMap = map[module.id];
      const platform = getPlatformExtension(module.path) || GENERIC_PLATFORM;
      const existingModule = moduleMap[platform];
      if (existingModule && existingModule.path !== module.path) {
        console.warn(
          `@providesModule naming collision:\n` +
          `  Duplicate module name: ${module.id}\n` +
          `  Paths: ${module.path} collides with ${existingModule.path}\n\n` +
          `This warning is caused by a @providesModule declaration ` +
          `with the same name accross two different files.`
        );
      }

      moduleMap[platform] = module;
    };

    for (const filePath in data.files) {
      if (mocksPattern && mocksPattern.test(filePath)) {
        mocks[path.basename(filePath, path.extname(filePath))] = filePath;
      }

      if (!this._isNodeModulesDir(filePath)) {
        const fileData = data.files[filePath];
        const moduleData = data.map[fileData.id];
        if (fileData.visited) {
          if (!fileData.id) {
            continue;
          } else if (fileData.id && moduleData) {
            map[fileData.id] = moduleData;
            continue;
          }
        }

        promises.push(
          this._getWorker()({filePath}).then(data => {
            fileData.visited = true;
            if (data.module) {
              fileData.id = data.module.id;
              setModule(data.module);
            }
            if (data.dependencies) {
              fileData.dependencies = data.dependencies;
            }
          })
        );
      }
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
        data.map = map;
        data.mocks = mocks;
        return data;
      });
  }

  _getWorker() {
    if (!this._workerPromise) {
      if (this._options.maxWorkers === 1) {
        this._workerPromise = data => new Promise(
          (resolve, reject) => worker(data, (error, data) => {
            if (error) {
              reject(error);
            } else {
              resolve(data);
            }
          })
        );
      } else {
        this._workerFarm = workerFarm(
          {
            maxConcurrentWorkers: this._options.maxWorkers,
          },
          require.resolve('./worker')
        );
        this._workerPromise = denodeify(this._workerFarm);
      }
    }

    return this._workerPromise;
  }

  _parse(data) {
    data = JSON.parse(data);
    for (const key in data) {
      Object.setPrototypeOf(data[key], null);
    }
    return data;
  }

  _crawl(data) {
    const crawl =
      (canUseWatchman && this._options.useWatchman) ? watchmanCrawl : nodeCrawl;

    return crawl(
      this._options.roots,
      this._options.extensions,
      this._options.ignorePattern,
      data
    );
  }

  _isNodeModulesDir(filePath) {
    if (!filePath.includes(NODE_MODULES)) {
      return false;
    }

    if (this._whitelist) {
      const match = filePath.match(this._whitelist);
      return !match || match[1].includes(NODE_MODULES);
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

HasteMap.GENERIC_PLATFORM = GENERIC_PLATFORM;

module.exports = HasteMap;
