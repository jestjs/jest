/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isMainThread, parentPort} from 'worker_threads';
import {PARENT_MESSAGE_CUSTOM} from '../types';
import {packMessage} from './safeMessageTransferring';

export default function messageParent(
  message: unknown,
  parentProcess = process,
): void {
  if (!isMainThread && parentPort != null) {
    parentPort.postMessage([PARENT_MESSAGE_CUSTOM, message]);
  } else if (typeof parentProcess.send === 'function') {
    try {
      parentProcess.send([PARENT_MESSAGE_CUSTOM, message]);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        // if .send is a function, it's a serialization issue
        !error.message.includes('.send is not a function')
      ) {
        // Apply specific serialization only in error cases
        // to avoid affecting performance in regular cases.
        parentProcess.send([PARENT_MESSAGE_CUSTOM, packMessage(message)]);
      } else {
        throw error;
      }
    }
  } else {
    throw new TypeError('"messageParent" can only be used inside a worker');
  }
}
