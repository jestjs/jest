/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {PARENT_MESSAGE_CUSTOM} from '../types';

const isWorkerThread = () => {
  try {
    // `Require` here to support Node v10
    const {isMainThread, parentPort} = require('worker_threads');
    return !isMainThread && parentPort;
  } catch {
    return false;
  }
};

const messageParent = (
  message: unknown,
  parentProcess: NodeJS.Process = process,
): void => {
  try {
    if (isWorkerThread()) {
      // `Require` here to support Node v10
      const {parentPort} = require('worker_threads');
      parentPort.postMessage([PARENT_MESSAGE_CUSTOM, message]);
    } else if (typeof parentProcess.send === 'function') {
      parentProcess.send([PARENT_MESSAGE_CUSTOM, message]);
    }
  } catch {
    throw new Error('"messageParent" can only be used inside a worker');
  }
};

export default messageParent;
