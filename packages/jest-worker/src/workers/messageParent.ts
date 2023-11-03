/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isMainThread, parentPort} from 'worker_threads';
import {PARENT_MESSAGE_CUSTOM} from '../types';
import {withoutCircularRefs} from './withoutCircularRefs';

export default function messageParent(
  message: unknown,
  parentProcess = process,
): void {
  if (!isMainThread && parentPort != null) {
    parentPort.postMessage([PARENT_MESSAGE_CUSTOM, message]);
  } else if (typeof parentProcess.send === 'function') {
    try {
      parentProcess.send([PARENT_MESSAGE_CUSTOM, message]);
    } catch (e: any) {
      if (/circular structure/.test(e?.message)) {
        // We can safely send a message to the parent process again
        // because previous sending was halted by "TypeError: Converting circular structure to JSON".
        // But this time the message will be cleared from circular references.
        parentProcess.send([
          PARENT_MESSAGE_CUSTOM,
          withoutCircularRefs(message),
        ]);
      } else {
        throw e;
      }
    }
  } else {
    throw new Error('"messageParent" can only be used inside a worker');
  }
}
