/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {parseError, printError, printNode} from '@stack-tools/node-tools';
import exit = require('exit');
import type {
  SerializableError,
  TestFileEvent,
  TestResult,
} from '@jest/test-result';
import type {Config} from '@jest/types';
import HasteMap, {SerializableModuleMap} from 'jest-haste-map';
import type Resolver from 'jest-resolve';
import Runtime from 'jest-runtime';
import {messageParent} from 'jest-worker';
import runTest from './runTest';
import type {ErrorWithCode, TestRunnerSerializedContext} from './types';

export type SerializableResolver = {
  config: Config.ProjectConfig;
  serializableModuleMap: SerializableModuleMap;
};

type WorkerData = {
  config: Config.ProjectConfig;
  globalConfig: Config.GlobalConfig;
  path: Config.Path;
  context?: TestRunnerSerializedContext;
};

// Make sure uncaught errors are logged before we exit.
process.on('uncaughtException', err => {
  console.error(err.stack);
  exit(1);
});

const formatError = (error: string | ErrorWithCode): SerializableError => {
  const parsedError = parseError(error, {parseFrames: false});

  const message = printError(parsedError, {frames: false});
  const stack = parsedError.frames?.map(frame => printNode(frame)).join('\n');

  return typeof error === 'string'
    ? {message, stack, type: 'Error'}
    : {code: error.code || undefined, message, stack, type: 'Error'};
};

const resolvers = new Map<string, Resolver>();
const getResolver = (config: Config.ProjectConfig) => {
  const resolver = resolvers.get(config.name);
  if (!resolver) {
    throw new Error('Cannot find resolver for: ' + config.name);
  }
  return resolver;
};

export function setup(setupData: {
  serializableResolvers: Array<SerializableResolver>;
}): void {
  // Module maps that will be needed for the test runs are passed.
  for (const {
    config,
    serializableModuleMap,
  } of setupData.serializableResolvers) {
    const moduleMap = HasteMap.getStatic(config).getModuleMapFromJSON(
      serializableModuleMap,
    );
    resolvers.set(config.name, Runtime.createResolver(config, moduleMap));
  }
}

const sendMessageToJest: TestFileEvent = (eventName, args) => {
  messageParent([eventName, args]);
};

export async function worker({
  config,
  globalConfig,
  path,
  context,
}: WorkerData): Promise<TestResult> {
  try {
    return await runTest(
      path,
      globalConfig,
      config,
      getResolver(config),
      context && {
        ...context,
        changedFiles: context.changedFiles && new Set(context.changedFiles),
        sourcesRelatedToTestsInChangedFiles:
          context.sourcesRelatedToTestsInChangedFiles &&
          new Set(context.sourcesRelatedToTestsInChangedFiles),
      },
      sendMessageToJest,
    );
  } catch (error: any) {
    throw formatError(error);
  }
}
