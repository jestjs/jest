/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable local/ban-types-eventually */

import * as asyncHooks from 'async_hooks';
import {promisify} from 'util';
import {setFlagsFromString} from 'v8';
import {runInNewContext} from 'vm';
import stripAnsi = require('strip-ansi');
import type {Config} from '@jest/types';
import {formatExecError} from 'jest-message-util';
import {ErrorWithStack} from 'jest-util';

export type HandleCollectionResult = () => Promise<Array<Error>>;

function stackIsFromUser(stack: string) {
  // Either the test file, or something required by it
  if (stack.includes('Runtime.requireModule')) {
    return true;
  }

  // jest-jasmine it or describe call
  if (stack.includes('asyncJestTest') || stack.includes('asyncJestLifecycle')) {
    return true;
  }

  // An async function call from within circus
  if (stack.includes('callAsyncCircusFn')) {
    // jest-circus it or describe call
    return (
      stack.includes('_callCircusTest') || stack.includes('_callCircusHook')
    );
  }

  return false;
}

const alwaysActive = () => true;

const hasWeakRef = typeof WeakRef === 'function';

const tick = promisify(setImmediate);

function runGarbageCollector() {
  const isGarbageCollectorHidden = !global.gc;

  // GC is usually hidden, so we have to expose it before running.
  setFlagsFromString('--expose-gc');
  runInNewContext('gc')();

  // The GC was not initially exposed, so let's hide it again.
  if (isGarbageCollectorHidden) {
    setFlagsFromString('--no-expose-gc');
  }
}

// Inspired by https://github.com/mafintosh/why-is-node-running/blob/master/index.js
// Extracted as we want to format the result ourselves
export default function collectHandles(): HandleCollectionResult {
  const activeHandles = new Map<
    number,
    {error: Error; isActive: () => boolean}
  >();
  const hook = asyncHooks.createHook({
    destroy(asyncId) {
      activeHandles.delete(asyncId);
    },
    init: function initHook(
      asyncId,
      type,
      _triggerAsyncId,
      resource: {} | NodeJS.Timeout,
    ) {
      if (
        type === 'PROMISE' ||
        type === 'TIMERWRAP' ||
        type === 'ELDHISTOGRAM' ||
        type === 'PerformanceObserver'
      ) {
        return;
      }
      const error = new ErrorWithStack(type, initHook);

      if (stackIsFromUser(error.stack || '')) {
        let isActive: () => boolean;

        if (type === 'Timeout' || type === 'Immediate') {
          // Timer that supports hasRef (Node v11+)
          if ('hasRef' in resource) {
            if (hasWeakRef) {
              const ref = new WeakRef(resource);
              isActive = () => {
                // @ts-expect-error: doesn't exist in v10 typings
                return ref.deref()?.hasRef() ?? false;
              };
            } else {
              // @ts-expect-error: doesn't exist in v10 typings
              isActive = resource.hasRef.bind(resource);
            }
          } else {
            // Timer that doesn't support hasRef
            isActive = alwaysActive;
          }
        } else {
          // Any other async resource
          isActive = alwaysActive;
        }

        activeHandles.set(asyncId, {error, isActive});
      }
    },
  });

  hook.enable();

  return async () => {
    runGarbageCollector();

    // wait some ticks to allow GC to run properly, see https://github.com/nodejs/node/issues/34636#issuecomment-669366235
    for (let i = 0; i < 10; i++) {
      await tick();
    }

    hook.disable();

    // Get errors for every async resource still referenced at this moment
    const result = Array.from(activeHandles.values())
      .filter(({isActive}) => isActive())
      .map(({error}) => error);

    activeHandles.clear();
    return result;
  };
}

export function formatHandleErrors(
  errors: Array<Error>,
  config: Config.ProjectConfig,
): Array<string> {
  const stacks = new Set();

  return (
    errors
      .map(err =>
        formatExecError(err, config, {noStackTrace: false}, undefined, true),
      )
      // E.g. timeouts might give multiple traces to the same line of code
      // This hairy filtering tries to remove entries with duplicate stack traces
      .filter(handle => {
        const ansiFree: string = stripAnsi(handle);

        const match = ansiFree.match(/\s+at(.*)/);

        if (!match || match.length < 2) {
          return true;
        }

        const stack = ansiFree.substr(ansiFree.indexOf(match[1])).trim();

        if (stacks.has(stack)) {
          return false;
        }

        stacks.add(stack);

        return true;
      })
  );
}
