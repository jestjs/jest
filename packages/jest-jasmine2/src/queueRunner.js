/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const once = require('once');
const pMap = require('p-map');
const pTimeout = require('./p-timeout');

type Options = {
  clearTimeout: (timeoutID: number) => void,
  fail: () => void,
  onComplete: () => void,
  onException: () => void,
  queueableFns: Array<QueueableFn>,
  setTimeout: (func: () => void, delay: number) => number,
  userContext: any,
};

type QueueableFn = {
  fn: (next: () => void) => void,
  timeout?: () => number,
};

function queueRunner(options: Options) {
  const mapper = ({fn, timeout}) => {
    const promise = new Promise(resolve => {
      const next = once(resolve);
      next.fail = (...args) => {
        options.fail(...args);
        resolve();
      };
      try {
        fn.call(options.userContext, next);
      } catch (e) {
        options.onException(e);
        resolve();
      }
    });
    if (!timeout) {
      return promise;
    }
    return pTimeout(
      promise,
      timeout(),
      options.clearTimeout,
      options.setTimeout,
      () => {
        const error = new Error(
          'Timeout - Async callback was not invoked within timeout specified ' +
          'by jasmine.DEFAULT_TIMEOUT_INTERVAL.',
        );
        options.onException(error);
      },
    );
  };

  return pMap(options.queueableFns, mapper, {concurrency: 1})
    .then(options.onComplete);
}

module.exports = queueRunner;
