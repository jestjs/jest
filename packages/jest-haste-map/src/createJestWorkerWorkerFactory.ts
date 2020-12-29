/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {WorkerFactory, WorkerInterface} from './types';
const {getSha1, process} = require('./worker');

export default function createJestWorkerWorkerFactory({
  maxWorkers,
}: {
  maxWorkers: number;
}): WorkerFactory {
  return ({forceInBand}) => {
    const Worker = require('jest-worker').Worker;

    if (forceInBand || maxWorkers <= 1) {
      return {end: () => {}, getSha1, process};
    }

    return new Worker(require.resolve('./worker'), {
      exposedMethods: ['getSha1', 'process'],
      maxRetries: 3,
      numWorkers: maxWorkers,
    }) as WorkerInterface;
  };
}
