/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Test = require('./Test');

const createHasteMap = require('./lib/createHasteMap');
const createResolver = require('./lib/createResolver');

const formatError = error => {
  if (!error) {
    return null;
  }

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
    type: error.type || 'Error',
  };
};

const resolvers = Object.create(null);

module.exports = (data, callback) => {
  const exceptionListener = err => {
    localCallback(err);
    process.exit(1);
  };
  process.on('uncaughtException', exceptionListener);
  const localCallback = (error, data) => {
    process.removeListener('uncaughtException', exceptionListener);
    callback(formatError(error), data);
  };
  try {
    const name = data.config.name;
    if (!resolvers[name]) {
      resolvers[name] = createResolver(
        data.config,
        createHasteMap(data.config).read()
      );
    }

    new Test(data.path, data.config, resolvers[name])
      .run()
      .then(
        result => localCallback(null, result),
        error => localCallback(error)
      );
  } catch (error) {
    localCallback(error);
  }
};
