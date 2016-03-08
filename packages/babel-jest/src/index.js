/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const babel = require('babel-core');
const jestPreset = require('babel-preset-jest');
const path = require('path');
const resolve = require('resolve');

const NODE_MODULES = path.sep + 'node_modules' + path.sep;

const reactNativeCache = new WeakMap();

const shouldCompile = (filename, config) => {
  if (filename.includes(NODE_MODULES)) {
    // It is common for react-native packages to be shipped to npm without
    // precompiled JavaScript files. To make configuration simple, if the
    // project is a react-native project, we ignore the node_modules check
    // and compile everything.
    //
    // To explicitly overwrite this setting, `preprocessorIgnorePatterns` can
    // be used.
    if (!reactNativeCache.has(config)) {
      let isReactNative = false;
      try {
        resolve.sync('react-native', {basedir: config.rootDir});
        isReactNative = true;
      } catch (e) {}
      reactNativeCache.set(config, isReactNative);
    }
    return !reactNativeCache.get(config);
  }
  return false;
};

module.exports = {
  process(src, filename, config) {
    if (!shouldCompile(filename, config) && babel.util.canCompile(filename)) {
      return babel.transform(src, {
        filename,
        presets: [jestPreset],
        retainLines: true,
      }).code;
    }
    return src;
  },
};
