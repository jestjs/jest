/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const path = require('path');
const fakeFile = {
  file: path.resolve(__dirname, '__tests__/hasteExampleHelper.js'),
  moduleName: 'fakeModuleName',
  sha1: 'fakeSha1',
};

const fakeJSON = 'fakeJSON';

const testPath = path.resolve(__dirname, '__tests__/hasteExample.test.js');

const allFiles = [fakeFile.file, testPath];

class HasteFS {
  getModuleName(file) {
    if (file === fakeFile.file) {
      return fakeFile.moduleName;
    }
    return null;
  }

  getSize(file) {
    return null;
  }

  getDependencies(file) {
    if (file === testPath) {
      return fakeFile.file;
    }
    return [];
  }

  getSha1(file) {
    if (file === fakeFile.file) {
      return fakeFile.sha1;
    }
    return null;
  }

  exists(file) {
    return allFiles.includes(file);
  }

  getAllFiles() {
    return allFiles;
  }

  getFileIterator() {
    return allFiles;
  }

  getAbsoluteFileIterator() {
    return allFiles;
  }

  matchFiles(pattern) {
    if (!(pattern instanceof RegExp)) {
      pattern = new RegExp(pattern);
    }
    const files = [];
    for (const file of this.getAbsoluteFileIterator()) {
      if (pattern.test(file)) {
        files.push(file);
      }
    }
    return files;
  }

  matchFilesWithGlob(globs, root) {
    return [];
  }
}

class ModuleMap {
  getModule(name, platform, supportsNativePlatform, type) {
    if (name === fakeFile.moduleName) {
      return fakeFile.file;
    }
    return null;
  }

  getPackage() {
    return null;
  }

  getMockModule() {
    return undefined;
  }

  getRawModuleMap() {
    return {};
  }

  toJSON() {
    return fakeJSON;
  }
}

class HasteMap {
  constructor(options) {
    this._cachePath = HasteMap.getCacheFilePath(
      options.cacheDirectory,
      options.id,
    );
  }

  async build() {
    return {
      hasteFS: new HasteFS(),
      moduleMap: new ModuleMap(),
    };
  }

  static getCacheFilePath(tmpdir, id) {
    return path.join(tmpdir, id);
  }

  getCacheFilePath() {
    return this._cachePath;
  }

  static getModuleMapFromJSON(json) {
    if (json === fakeJSON) {
      return new ModuleMap();
    }
    throw new Error('Failed to parse serialized module map');
  }
}

module.exports = HasteMap;
