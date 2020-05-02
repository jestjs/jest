/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * This module adds ability to test async promise code with jasmine by
 * returning a promise from `it/test` and `before/afterEach/All` blocks.
 */

import type {Config, Global} from '@jest/types';
import co from 'co';
import isGeneratorFn from 'is-generator-fn';
import throat from 'throat';
import isError from './isError';
import type {Jasmine} from './types';
import type Spec from './jasmine/Spec';
import type {QueueableFn} from './queueRunner';

interface DoneFn {
  (): void;
  fail: (error: Error) => void;
}

function isPromise(obj: any) {
  return obj && typeof obj.then === 'function';
}

function promisifyLifeCycleFunction(
  originalFn: Function,
  env: Jasmine['currentEnv_'],
) {
  return function <T>(
    fn: Function | (() => Promise<T>) | GeneratorFunction | undefined,
    timeout?: number,
  ) {
    if (!fn) {
      return originalFn.call(env);
    }

    const hasDoneCallback = typeof fn === 'function' && fn.length > 0;

    if (hasDoneCallback) {
      // Jasmine will handle it
      return originalFn.call(env, fn, timeout);
    }

    const extraError = new Error();

    // Without this line v8 stores references to all closures
    // in the stack in the Error object. This line stringifies the stack
    // property to allow garbage-collecting objects on the stack
    // https://crbug.com/v8/7142
    extraError.stack = extraError.stack;

    // We make *all* functions async and run `done` right away if they
    // didn't return a promise.
    const asyncJestLifecycle = function (done: DoneFn) {
      const wrappedFn = isGeneratorFn(fn) ? co.wrap(fn) : fn;
      const returnValue = wrappedFn.call({});

      if (isPromise(returnValue)) {
        returnValue.then(done.bind(null, null), (error: Error) => {
          const {isError: checkIsError, message} = isError(error);

          if (message) {
            extraError.message = message;
          }
          done.fail(checkIsError ? error : extraError);
        });
      } else {
        done();
      }
    };

    return originalFn.call(env, asyncJestLifecycle, timeout);
  };
}

// Similar to promisifyLifeCycleFunction but throws an error
// when the return value is neither a Promise nor `undefined`
function promisifyIt(
  originalFn: Function,
  env: Jasmine['currentEnv_'],
  jasmine: Jasmine,
) {
  return function (specName: string, fn: Function, timeout?: number) {
    if (!fn) {
      const spec = originalFn.call(env, specName);
      spec.pend('not implemented');
      return spec;
    }

    const hasDoneCallback = fn.length > 0;

    if (hasDoneCallback) {
      return originalFn.call(env, specName, fn, timeout);
    }

    const extraError = new Error();

    // Without this line v8 stores references to all closures
    // in the stack in the Error object. This line stringifies the stack
    // property to allow garbage-collecting objects on the stack
    // https://crbug.com/v8/7142
    extraError.stack = extraError.stack;

    const asyncJestTest = function (done: DoneFn) {
      const wrappedFn = isGeneratorFn(fn) ? co.wrap(fn) : fn;
      const returnValue = wrappedFn.call({});

      if (isPromise(returnValue)) {
        returnValue.then(done.bind(null, null), (error: Error) => {
          const {isError: checkIsError, message} = isError(error);

          if (message) {
            extraError.message = message;
          }

          if (jasmine.Spec.isPendingSpecException(error)) {
            env.pending(message!);
            done();
          } else {
            done.fail(checkIsError ? error : extraError);
          }
        });
      } else if (returnValue === undefined) {
        done();
      } else {
        done.fail(
          new Error(
            'Jest: `it` and `test` must return either a Promise or undefined.',
          ),
        );
      }
    };

    return originalFn.call(env, specName, asyncJestTest, timeout);
  };
}

function makeConcurrent(
  originalFn: (
    description: string,
    fn: QueueableFn['fn'],
    timeout?: number,
  ) => Spec,
  env: Jasmine['currentEnv_'],
  mutex: ReturnType<typeof throat>,
): Global.ItConcurrentBase {
  return function (specName, fn, timeout) {
    let promise: Promise<unknown> = Promise.resolve();

    const spec = originalFn.call(env, specName, () => promise, timeout);
    if (env != null && !env.specFilter(spec)) {
      return spec;
    }

    try {
      promise = mutex(() => {
        const promise = fn();
        if (isPromise(promise)) {
          return promise;
        }
        throw new Error(
          `Jest: concurrent test "${spec.getFullName()}" must return a Promise.`,
        );
      });
    } catch (error) {
      promise = Promise.reject(error);
    }

    return spec;
  };
}

export default function jasmineAsyncInstall(
  globalConfig: Config.GlobalConfig,
  global: Global.Global,
): void {
  const jasmine = global.jasmine as Jasmine;
  const mutex = throat(globalConfig.maxConcurrency);

  const env = jasmine.getEnv();
  env.it = promisifyIt(env.it, env, jasmine);
  env.fit = promisifyIt(env.fit, env, jasmine);
  global.it.concurrent = (env => {
    const concurrent = makeConcurrent(
      env.it,
      env,
      mutex,
    ) as Global.ItConcurrentExtended;
    concurrent.only = makeConcurrent(env.fit, env, mutex);
    concurrent.skip = makeConcurrent(env.xit, env, mutex);
    return concurrent;
  })(env);
  global.fit.concurrent = makeConcurrent(env.fit, env, mutex);
  env.afterAll = promisifyLifeCycleFunction(env.afterAll, env);
  env.afterEach = promisifyLifeCycleFunction(env.afterEach, env);
  env.beforeAll = promisifyLifeCycleFunction(env.beforeAll, env);
  env.beforeEach = promisifyLifeCycleFunction(env.beforeEach, env);
}
