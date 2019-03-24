/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Config} from '@jest/types';
import {SerializableError, TestResult} from '@jest/test-result';
import HasteMap, {ModuleMap, SerializableModuleMap} from 'jest-haste-map';
import exit from 'exit';
import {separateMessageFromStack} from 'jest-message-util';
import Runtime from 'jest-runtime';
import Resolver from 'jest-resolve';
import {ErrorWithCode, TestRunnerSerializedContext} from './types';
import runTest from './runTest';

type WorkerData = {
  config: Config.ProjectConfig;
  globalConfig: Config.GlobalConfig;
  path: Config.Path;
  serializableModuleMap: SerializableModuleMap | null;
  moduleMapUniqueID: number | null;
  context?: TestRunnerSerializedContext;
};

// Make sure uncaught errors are logged before we exit.
process.on('uncaughtException', err => {
  console.error(err.stack);
  exit(1);
});

const formatError = (error: string | ErrorWithCode): SerializableError => {
  if (typeof error === 'string') {
    const {message, stack} = separateMessageFromStack(error);
    return {
      message,
      stack,
      type: 'Error',
    };
  }

  return {
    code: error.code || undefined,
    message: error.message,
    stack: error.stack,
    type: 'Error',
  };
};

const resolvers = new Map<string, Resolver>();
const getResolver = (
  config: Config.ProjectConfig,
  moduleMap: ModuleMap | null,
) => {
  // In watch mode, the raw module map with all haste modules is passed from
  // the test runner to the watch command. This is because jest-haste-map's
  // watch mode does not persist the haste map on disk after every file change.
  // To make this fast and consistent, we pass it from the TestRunner.
  const name = config.name;
  if (moduleMap || !resolvers.has(name)) {
    resolvers.set(
      name,
      Runtime.createResolver(
        config,
        moduleMap || Runtime.createHasteMap(config).readModuleMap(),
      ),
    );
  }
  return resolvers.get(name)!;
};

const deserializedModuleMaps = new Map<string, number>();
export async function worker({
  config,
  globalConfig,
  path,
  serializableModuleMap,
  moduleMapUniqueID,
  context,
}: WorkerData): Promise<TestResult> {
  try {
    // If the module map ID does not match what is currently being used by the
    // config's resolver was passed, deserialize it and update the resolver.
    let moduleMap: ModuleMap | null = null;
    if (
      serializableModuleMap &&
      moduleMapUniqueID &&
      deserializedModuleMaps.get(config.name) !== moduleMapUniqueID
    ) {
      deserializedModuleMaps.set(config.name, moduleMapUniqueID);
      moduleMap = HasteMap.ModuleMap.fromJSON(serializableModuleMap);
    }

    return await runTest(
      path,
      globalConfig,
      config,
      getResolver(config, moduleMap),
      context && {
        ...context,
        changedFiles: context.changedFiles && new Set(context.changedFiles),
      },
    );
  } catch (error) {
    throw formatError(error);
  }
}
