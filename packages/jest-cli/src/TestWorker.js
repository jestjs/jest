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

const createHasteMap = require('./lib/createHasteMap');
const createResolver = require('./lib/createResolver');

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
    type: error.type || 'Error',
  };
};

const resolvers = Object.create(null);

module.exports = (data, callback) => {
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
        result => callback(null, result),
        error => callback(formatError(error))
      );
  } catch (error) {
    callback(formatError(error));
  }
};
