/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import BaseWorkerPool from './base/BaseWorkerPool';

import type {
  ChildMessage,
  OnStart,
  OnEnd,
  WorkerInterface,
  WorkerPoolInterface,
} from './types';

class WorkerPool extends BaseWorkerPool implements WorkerPoolInterface {
  send(
    worker: WorkerInterface,
    request: ChildMessage,
    onStart: OnStart,
    onEnd: OnEnd,
  ): void {
    worker.send(request, onStart, onEnd);
  }
}

export default WorkerPool;
