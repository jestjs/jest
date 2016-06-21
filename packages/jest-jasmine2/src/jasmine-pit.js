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
 * returning a promise from `it\fit` block.
 */

'use strict';

import type {Global} from 'types/Global';

function isPromise(obj) {
  return obj && typeof obj.then === 'function';
}

// return a wrapping function: `env.fit = promisifyIt(env.it, env)`
function promisifyIt(originalFn, env) {
  return function(specName, fn, timeout) {
    if (!fn) {
      return null;
    }

    const isAsync = fn.length; // `done` was passed

    if (isAsync) {
      // jasmine will handle it
      return originalFn.call(env, specName, fn, timeout);
    } else {
      // we make *all* tests async and run `done` right away if they
      // didn't return a promise.
      return originalFn.call(env, specName, function(done) {
        const returnValue = fn.apply(this, arguments);

        if (isPromise(returnValue)) {
          returnValue.then(done).catch(done.fail);
        } else if (returnValue === undefined) {
          done();
        } else {
          done.fail(new Error(
            'Jest: `it` must return either a Promise or undefined.'
          ));
        }
      }, timeout);
    }
  };
}

function install(global: Global) {
  const jasmine = global.jasmine;

  const env = jasmine.getEnv();
  global.pit = env.it = promisifyIt(env.it, env);
  env.fit = promisifyIt(env.fit, env);
}

module.exports = {
  install,
};
