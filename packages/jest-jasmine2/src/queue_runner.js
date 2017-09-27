/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import PCancelable from 'p-cancelable';
import pTimeout from './p_timeout';

type Options = {
  clearTimeout: (timeoutID: number) => void,
  fail: () => void,
  onException: (error: Error) => void,
  queueableFns: Array<QueueableFn>,
  setTimeout: (func: () => void, delay: number) => number,
  userContext: any,
};

type QueueableFn = {
  fn: (next: () => void) => void,
  timeout?: () => number,
};

export default function queueRunner(options: Options) {
  const token = new PCancelable((onCancel, resolve) => {
    onCancel(resolve);
  });

  const mapper = ({fn, timeout}) => {
    let promise = new Promise(resolve => {
      const next = function(err) {
        if (err) {
          options.fail.apply(null, arguments);
        }
        resolve();
      };

      next.fail = function() {
        options.fail.apply(null, arguments);
        resolve();
      };
      try {
        fn.call(options.userContext, next);
      } catch (e) {
        options.onException(e);
        resolve();
      }
    });

    promise = Promise.race([promise, token]);

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

  const result = options.queueableFns.reduce(
    (promise, fn) => promise.then(() => mapper(fn)),
    Promise.resolve(),
  );

  return {
    cancel: token.cancel.bind(token),
    catch: result.catch.bind(result),
    then: result.then.bind(result),
  };
}
