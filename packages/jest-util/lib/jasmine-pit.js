/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

function assertPromise(promise) {
  if (!promise || typeof promise.then !== 'function') {
    throw new Error(`pit(...): tests must return a promise`);
  }
}

function wrapForJasmine1(env, promiseFn) {
  return () => {
    let error = null;
    let isFinished = false;
    const currentSpec = env.currentSpec;
    currentSpec.runs(() => {
      try {
        const promise = promiseFn.call(currentSpec);
        assertPromise(promise);
        promise
          .then(() => isFinished = true)
          .catch(err => {
            error = err;
            isFinished = true;
          });
      } catch (e) {
        error = e;
        isFinished = true;
      }
    });
    currentSpec.waitsFor(() => isFinished);
    currentSpec.runs(() => {
      if (error) {
        throw error;
      }
    });
  };
}

function wrapForJasmine2(promiseFn) {
  return done => {
    var promise = promiseFn();
    var fail = done.fail ? done.fail : err => { throw err; };

    try {
      assertPromise(promise);
    } catch (err) {
      fail(err);
    }

    promise
      .then(res => done(res))
      .catch(err => fail(err));
  };
}

function install(global) {
  const jasmine = global.jasmine;
  const env = jasmine.getEnv();
  const isJasmine1 = jasmine.version_ && jasmine.version_.major === 1;
  const wrapFn = isJasmine1 ? wrapForJasmine1.bind(null, env) : wrapForJasmine2;

  global.pit = function pit(specName, promiseFn) {
    return env.it(specName, wrapFn(promiseFn));
  };
  global.xpit = function xpit(specName, promiseFn) {
    return env.xit(specName, wrapFn(promiseFn));
  };

  if (isJasmine1) {
    global.pit.only = function pitOnly(specName, promiseFn) {
      return env.it.only(specName, wrapFn(promiseFn));
    };
  } else {
    global.fpit = function fpit(desc, promiseFn) {
      return env.fit(desc, wrapFn(promiseFn));
    };
  }
}

module.exports = {
  install,
};
