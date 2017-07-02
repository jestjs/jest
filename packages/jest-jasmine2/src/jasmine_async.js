/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

/**
 * This module adds ability to test async promise code with jasmine by
 * returning a promise from `it/test` and `before/afterEach/All` blocks.
 */

import type {Global} from 'types/Global';

function isPromise(obj) {
  return obj && typeof obj.then === 'function';
}

function promisifyLifeCycleFunction(originalFn, env) {
  return function(fn, timeout) {
    if (!fn) {
      return originalFn.call(env);
    }

    const hasDoneCallback = fn.length > 0;

    if (hasDoneCallback) {
      // Jasmine will handle it
      return originalFn.call(env, fn, timeout);
    }

    // We make *all* functions async and run `done` right away if they
    // didn't return a promise.
    const asyncFn = function(done) {
      const returnValue = fn.call(this);

      if (isPromise(returnValue)) {
        returnValue.then(done, done.fail);
      } else {
        done();
      }
    };

    return originalFn.call(env, asyncFn, timeout);
  };
}

// Similar to promisifyLifeCycleFunction but throws an error
// when the return value is neither a Promise nor `undefined`
function promisifyIt(originalFn, env) {
  return function(specName, fn, timeout) {
    if (!fn) {
      const spec = originalFn.call(env, specName);
      spec.pend('not implemented');
      return spec;
    }

    const hasDoneCallback = fn.length > 0;

    if (hasDoneCallback) {
      return originalFn.call(env, specName, fn, timeout);
    }

    const asyncFn = function(done) {
      const returnValue = fn.call({});

      if (isPromise(returnValue)) {
        returnValue.then(done, done.fail);
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

    return originalFn.call(env, specName, asyncFn, timeout);
  };
}

function makeConcurrent(originalFn: Function, env) {
  return function(specName, fn, timeout) {
    if (env != null && !env.specFilter({getFullName: () => specName || ''})) {
      return originalFn.call(env, specName, () => Promise.resolve(), timeout);
    }

    let promise;

    try {
      promise = fn();
      if (!isPromise(promise)) {
        throw new Error(
          `Jest: concurrent test "${specName}" must return a Promise.`,
        );
      }
    } catch (error) {
      return originalFn.call(env, specName, () => Promise.reject(error));
    }

    return originalFn.call(env, specName, () => promise, timeout);
  };
}

function install(global: Global) {
  const jasmine = global.jasmine;

  const env = jasmine.getEnv();
  env.it = promisifyIt(env.it, env);
  env.fit = promisifyIt(env.fit, env);
  global.it.concurrent = makeConcurrent(env.it, env);
  global.it.concurrent.only = makeConcurrent(env.fit, env);
  global.it.concurrent.skip = makeConcurrent(env.xit, env);
  global.fit.concurrent = makeConcurrent(env.fit);
  env.afterAll = promisifyLifeCycleFunction(env.afterAll, env);
  env.afterEach = promisifyLifeCycleFunction(env.afterEach, env);
  env.beforeAll = promisifyLifeCycleFunction(env.beforeAll, env);
  env.beforeEach = promisifyLifeCycleFunction(env.beforeEach, env);
}

module.exports = {
  install,
};
