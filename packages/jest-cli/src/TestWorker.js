/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {Config, Path} from 'types/Config';
import type {Error, TestResult} from 'types/TestResult';

const {separateMessageFromStack} = require('jest-util');

// Make sure uncaught errors are logged before we exit.
process.on('uncaughtException', err => {
  console.error(err.stack);
  process.exit(1);
});

const Runtime = require('jest-runtime');
const runTest = require('./runTest');

type WorkerData = {
  config: Config,
  path: Path,
};

type WorkerCallback = (error: ?Error, result?: TestResult) => void;

const formatError = error => {
  if (typeof error === 'string') {
    const {message, stack} = separateMessageFromStack(error);
    return {
      stack,
      message,
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

module.exports = (data: WorkerData, callback: WorkerCallback) => {
  try {
    const name = data.config.name;
    if (!resolvers[name]) {
      resolvers[name] = Runtime.createResolver(
        data.config,
        Runtime.createHasteMap(data.config).readModuleMap(),
      );
    }

    runTest(data.path, data.config, resolvers[name])
      .then(
        result => callback(null, result),
        error => callback(formatError(error)),
      );
  } catch (error) {
    callback(formatError(error));
  }
};
