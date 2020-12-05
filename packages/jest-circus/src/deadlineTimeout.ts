/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {formatTime} from 'jest-util';
import {getState} from './state';

export function deadline(): number {
  const deadline = getState()?.currentlyRunningChildDeadline;
  if (null === deadline) {
    throw new Error('bug! no deadline available');
  }
  return deadline;
}

export async function withinDeadline<T>(promise: Promise<T>): Promise<T> {
  return timeout(promise, deadline() - Date.now());
}

function isUs(line: string): boolean {
  return line.includes('deadlineTimeout') && line.includes('jest-circus');
}

async function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const {promise: sleepCancelled, clear} = cancellableSleep(ms);
  try {
    return await Promise.race([
      promise,
      (async () => {
        if (await sleepCancelled) {
          return undefined as never;
        }
        const here = new Error(`deadline exceeded (waited here for ${formatTime(ms)})`);
        here.stack = here.stack
          ?.split('\n')
          .filter(line => !isUs(line))
          .join('\n');
        throw here;
      })(),
    ]);
  } finally {
    clear();
  }
}

const cancellableSleep = (ms: number) => {
  const state: {
    resolvePromise: null | {(firedForReal: boolean): void};
    timeoutId: null | ReturnType<typeof setTimeout>;
  } = {
    resolvePromise: null,
    timeoutId: null,
  };

  const promise = new Promise<boolean>(resolve => {
    state.resolvePromise = resolve;
    state.timeoutId = setTimeout(() => resolve(false), ms);
  });

  return {
    clear: () => {
      state.resolvePromise?.(true);
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
      }
    },
    promise,
  };
};
