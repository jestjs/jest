/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
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
const getCacheFilePath = require('node-haste').Cache.getCacheFilePath;
const getCacheKey = require('./lib/getCacheKey');

const formatError = error => {
  if (typeof error === 'string') {
    return {
      stack: null,
      message: error,
      type: 'Error',
    };
  }

  return {
    stack: error.stack,
    message: error.message,
    type: error.type,
  };
};

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
        err => callback(formatError(err))
      );
  } catch (err) {
    callback(formatError(err));
  }
};
