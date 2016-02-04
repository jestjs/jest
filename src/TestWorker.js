/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

// Make sure uncaught errors are logged before we exit.
process.on('uncaughtException', err => {
  console.error(err.stack);
  process.exit(1);
});

const Test = require('./Test');

const fs = require('graceful-fs');
const getCacheFilePath = require('node-haste/lib/Cache/lib/getCacheFilePath');
const getCacheKey = require('./lib/getCacheKey');

let moduleMap;

module.exports = (data, callback) => {
  try {
    if (!moduleMap) {
      const cacheFile = getCacheFilePath(
        data.config.cacheDirectory,
        getCacheKey('jest-module-map', data.config)
      );
      moduleMap = JSON.parse(fs.readFileSync(cacheFile));
    }

    new Test(data.path, data.config, moduleMap)
      .run()
      .then(
        result => callback(null, result),
        err => callback(err)
      );
  } catch (err) {
    callback(err);
  }
};
