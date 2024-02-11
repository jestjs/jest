/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable local/ban-types-eventually */

import * as asyncHooks from 'async_hooks';
import {promisify} from 'util';
import * as v8 from 'v8';
import * as vm from 'vm';
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

const asyncSleep = promisify(setTimeout);

let gcFunc: (() => void) | undefined = (globalThis as any).gc;
function runGC() {
  if (!gcFunc) {
    v8.setFlagsFromString('--expose-gc');
    gcFunc = vm.runInNewContext('gc');
    v8.setFlagsFromString('--no-expose-gc');
    if (!gcFunc) {
      throw new Error(
        'Cannot find `global.gc` function. Please run node with `--expose-gc` and report this issue in jest repo.',
      );
    }
  }

  gcFunc();
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
      triggerAsyncId,
      resource: {} | NodeJS.Timeout,
    ) {
      // Skip resources that should not generally prevent the process from
      // exiting, not last a meaningfully long time, or otherwise shouldn't be
      // tracked.
      if (
        [
          'PROMISE',
          'TIMERWRAP',
          'ELDHISTOGRAM',
          'PerformanceObserver',
          'RANDOMBYTESREQUEST',
          'DNSCHANNEL',
          'ZLIB',
          'SIGNREQUEST',
          'TLSWRAP',
          'TCPWRAP',
        ].includes(type)
      ) {
        return;
      }
      const error = new ErrorWithStack(type, initHook, 100);
      let fromUser = stackIsFromUser(error.stack || '');

      // If the async resource was not directly created by user code, but was
      // triggered by another async resource from user code, track it and use
      // the original triggering resource's stack.
      if (!fromUser) {
        const triggeringHandle = activeHandles.get(triggerAsyncId);
        if (triggeringHandle) {
          fromUser = true;
          error.stack = triggeringHandle.error.stack;
        }
      }

      if (fromUser) {
        let isActive: () => boolean;

        // Handle that supports hasRef
        if ('hasRef' in resource) {
          if (hasWeakRef) {
            const ref = new WeakRef(resource);
            isActive = () => {
              return ref.deref()?.hasRef() ?? false;
            };
          } else {
            isActive = resource.hasRef.bind(resource);
          }
        } else {
          // Handle that doesn't support hasRef
          isActive = alwaysActive;
        }

        activeHandles.set(asyncId, {error, isActive});
      }
    },
  });

  hook.enable();

  return async () => {
    // Wait briefly for any async resources that have been queued for
    // destruction to actually be destroyed.
    // For example, Node.js TCP Servers are not destroyed until *after* their
    // `close` callback runs. If someone finishes a test from the `close`
    // callback, we will not yet have seen the resource be destroyed here.
    await asyncSleep(0);

    if (activeHandles.size > 0) {
      await asyncSleep(30);

      if (activeHandles.size > 0) {
        runGC();

        await asyncSleep(0);
      }
    }

    hook.disable();

    // Get errors for every async resource still referenced at this moment
    const result = [...activeHandles.values()]
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
  const stacks = new Map<string, {stack: string; names: Set<string>}>();

  for (const err of errors) {
    const formatted = formatExecError(
      err,
      config,
      {noStackTrace: false},
      undefined,
      true,
    );

    // E.g. timeouts might give multiple traces to the same line of code
    // This hairy filtering tries to remove entries with duplicate stack traces

    const ansiFree: string = stripAnsi(formatted);
    const match = ansiFree.match(/\s+at(.*)/);
    if (!match || match.length < 2) {
      continue;
    }

    const stackText = ansiFree.slice(ansiFree.indexOf(match[1])).trim();

    const name = ansiFree.match(/(?<=● {2}).*$/m);
    if (name == null || name.length === 0) {
      continue;
    }

    const stack = stacks.get(stackText) || {
      names: new Set(),
      stack: formatted.replace(name[0], '%%OBJECT_NAME%%'),
    };

    stack.names.add(name[0]);

    stacks.set(stackText, stack);
  }

  return [...stacks.values()].map(({stack, names}) =>
    stack.replace('%%OBJECT_NAME%%', [...names].join(',')),
  );
}
