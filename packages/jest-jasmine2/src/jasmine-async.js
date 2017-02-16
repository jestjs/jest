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
 * returning a promise from `it\fit` and `beforeEach/afterEach` blocks.
 */

'use strict';

import type {Global} from 'types/Global';

function isPromise(obj) {
  return obj && typeof obj.then === 'function';
}

function promisifyFunction(fn, typeName) {
  const hasDoneCallback = fn.length;

  if (hasDoneCallback) {
    // Jasmine will handle it
    return fn;
  }

  // We make *all* functions async and run `done` right away if they
  // didn't return a promise.
  return function(done) {
    const returnValue = fn.apply(this, arguments);

    if (isPromise(returnValue)) {
      returnValue.then(done, done.fail);
    } else if (returnValue === undefined) {
      done();
    } else {
      done.fail(new Error(
        'Jest: ' + typeName + ' must return either a Promise or undefined.',
      ));
    }
  };
}

function promisifyIt(originalFn, env) {
  return function(specName, fn, timeout) {
    if (!fn) {
      const spec = originalFn.call(env, specName);
      spec.pend('not implemented');
      return spec;
    }

    const promiseFn = promisifyFunction(fn, '`it` and `test`');

    return originalFn.call(env, specName, promiseFn, timeout);
  };
}

function promisifyLifeCycleFunction(originalFn, env) {
  return function(fn, timeout) {
    const typeName = '`beforeAll`, `afterAll`, `beforeEach`, and `afterEach`';
    const promiseFn = promisifyFunction(fn, typeName);

    return originalFn.call(env, promiseFn, timeout);
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
