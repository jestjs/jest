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
const docblock = require('./lib/docblock');
const execSync = require('child_process').execSync;
const fs = require('graceful-fs');
const getPlatformExtension = require('./lib/getPlatformExtension');
const nodeCrawl = require('./crawlers/node');
const os = require('os');
const path = require('./fastpath');
const watchmanCrawl = require('./crawlers/watchman');

const GENERIC_PLATFORM = 'generic';
const NODE_MODULES = path.sep + 'node_modules' + path.sep;
const PACKAGE_JSON = path.sep + 'package.json';
const VERSION = require('../package.json').version;

const readFile = denodeify(fs.readFile);
const writeFile = denodeify(fs.writeFile);

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

    this._buildPromise = null;
    this._cachePath = HasteMap.getCacheFilePath(
      this._options.cacheDirectory,
      VERSION,
      this._options.roots.join(':'),
      this._options.extensions.join(':'),
      this._options.platforms.join(':')
    );
  }

  static getCacheFilePath(tmpdir) {
    const hash = crypto.createHash('md5');
    Array.from(arguments).slice(1).forEach(arg => hash.update(arg));
    return path.join(tmpdir, hash.digest('hex'));
  }

  build() {
    if (!this._buildPromise) {
      this._buildPromise = this._buildFileMap()
        .then(data => this._buildHasteMap(data));
    }
    return this._buildPromise;
  }

  persist(data) {
    return writeFile(this._cachePath, JSON.stringify(data)).then(() => data);
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

  _buildFileMap() {
    const read = this._options.resetCache ? this._createEmptyMap : this.read;

    return Promise.resolve()
      .then(() => read.call(this))
      .catch(() => this._createEmptyMap())
      .then(data => this._crawl(data));
  }

  _buildHasteMap(data) {
    const map = Object.create(null);
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

      const fileData = data.files[module.path];
      fileData.id = module.id;
      moduleMap[platform] = module;
    };

    const promises = [];
    for (const filePath in data.files) {
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

        fileData.visited = true;
        if (filePath.endsWith(PACKAGE_JSON)) {
          promises.push(this._processHastePackage(filePath, setModule));
        } else {
          promises.push(this._processHasteModule(filePath, setModule));
        }
      }
    }

    return Promise.all(promises).then(() => {
      data.map = map;
      return data;
    });
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
    };
  }

  _processHastePackage(filePath, setModule) {
    return readFile(filePath, 'utf-8')
      .then(data => {
        data = JSON.parse(data);
        if (data.name) {
          setModule({
            id: data.name,
            path: filePath,
            type: 'package',
          });
        }
      });
  }

  _processHasteModule(filePath, setModule) {
    return readFile(filePath, 'utf-8')
      .then(data => {
        const doc = docblock.parseAsObject(data);
        const id = doc.providesModule || doc.provides;

        if (id) {
          setModule({
            id,
            path: filePath,
            type: 'module',
          });
        }
      });
  }

}

HasteMap.GENERIC_PLATFORM = GENERIC_PLATFORM;

module.exports = HasteMap;
