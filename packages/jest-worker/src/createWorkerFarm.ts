/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isAbsolute} from 'path';
import WorkerFarm from './WorkerFarm';
import type {WorkerFarmOptions, WorkerModule} from './types';

export type JestWorkerFarm<T> = WorkerFarm & WorkerModule<T>;

const reservedKeys = ['end', 'getStderr', 'getStdout', 'setup', 'teardown'];

const isReserved = (methodName: string) => reservedKeys.includes(methodName);
const isPrivate = (methodName: string) => methodName.startsWith('_');

async function resolveExposedMethods(
  workerPath: string,
  exposedMethods: ReadonlyArray<string> = [],
) {
  if (exposedMethods.length) {
    exposedMethods.forEach(methodName => {
      if (isReserved(methodName)) {
        throw new Error(
          `Cannot expose '${methodName}()', the method name is reserved.`,
        );
      }
    });

    return exposedMethods;
  }

  const module: Record<string, unknown> = require(workerPath);

  exposedMethods = Object.keys(module).filter(
    methodName =>
      typeof module[methodName] === 'function' &&
      !isPrivate(methodName) &&
      !isReserved(methodName),
  );

  if (typeof module === 'function') {
    exposedMethods = [...exposedMethods, 'default'];
  }

  return exposedMethods;
}

export async function createWorkerFarm<
  T extends Record<string, unknown> = Record<string, unknown>,
>(workerPath: string, options?: WorkerFarmOptions): Promise<JestWorkerFarm<T>> {
  if (!isAbsolute(workerPath)) {
    throw new Error(
      `Worker module path must be absolute, got '${workerPath}'.`,
    );
  }

  const exposedMethods = await resolveExposedMethods(
    workerPath,
    options?.exposedMethods,
  );

  return new WorkerFarm(workerPath, {
    ...options,
    exposedMethods,
  }) as JestWorkerFarm<T>;
}
