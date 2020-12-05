/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let resolvePromise: { (value: boolean): void } | undefined;
  try {
    return await Promise.race([
      promise,
      (async (): Promise<never> => {
        const firedForReal = await new Promise<boolean>(resolve => {
          resolvePromise = resolve;
          timeoutId = setTimeout(() => resolve(true), ms);
        });
        if (!firedForReal) {
          return undefined as never;
        }
        const here = new Error(`deadline exceeded (waited here for ${ms}ms)`);
        here.stack = here.stack
          ?.split('\n')
          .filter(line => !isUs(line))
          .join('\n');
        throw here;
      })(),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    resolvePromise?.(false);
  }
}
