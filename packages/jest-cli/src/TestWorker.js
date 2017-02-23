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
import type {SerializableError, TestResult} from 'types/TestResult';
import type {RawModuleMap} from 'types/HasteMap';

// Make sure uncaught errors are logged before we exit.
process.on('uncaughtException', err => {
  console.error(err.stack);
  process.exit(1);
});

const {ModuleMap} = require('jest-haste-map');
const {separateMessageFromStack} = require('jest-message-util');

const Runtime = require('jest-runtime');
const runTest = require('./runTest');

type WorkerData = {|
  config: Config,
  path: Path,
  rawModuleMap?: RawModuleMap,
|};

type WorkerCallback = (error: ?SerializableError, result?: TestResult) => void;

const formatError = (error: string|Error): SerializableError => {
  if (typeof error === 'string') {
    const {message, stack} = separateMessageFromStack(error);
    return {
      message,
      stack,
      type: 'Error',
    };
  }

  return {
    message: error.message,
    stack: error.stack,
    type: 'Error',
  };
};

const resolvers = Object.create(null);
const getResolver = (config, rawModuleMap) => {
  // In watch mode, the raw module map with all haste modules is passed from
  // the test runner to the watch command. This is because jest-haste-map's
  // watch mode does not persist the haste map on disk after every file change.
  // To make this fast and consistent, we pass it from the TestRunner.
  if (rawModuleMap) {
    return Runtime.createResolver(
      config,
      new ModuleMap(rawModuleMap.map, rawModuleMap.mocks),
    );
  } else {
    const name = config.name;
    if (!resolvers[name]) {
      resolvers[name] = Runtime.createResolver(
        config,
        Runtime.createHasteMap(config).readModuleMap(),
      );
    }
    return resolvers[name];
  }
};

module.exports = (
  {config, path, rawModuleMap}: WorkerData,
  callback: WorkerCallback,
) => {
  let parentExited = false;
  const disconnectCallback = () => parentExited = true;
  const removeListener =
    () => process.removeListener('disconnect', disconnectCallback);
  process.on('disconnect', disconnectCallback);

  try {
    runTest(path, config, getResolver(config, rawModuleMap))
      .then(
        result => {
          removeListener();
          if (!parentExited) {
            callback(null, result);
          }
        },
        error => {
          removeListener();
          if (!parentExited) {
            callback(formatError(error));
          }
        },
      );
  } catch (error) {
    callback(formatError(error));
  }
};
