/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @ts-ignore ignore vendor file
import PCancelable from './PCancelable';
import pTimeout from './pTimeout';

type Global = NodeJS.Global;

export type Options = {
  clearTimeout: Global['clearTimeout'];
  fail: (error: Error) => void;
  onException: (error: Error) => void;
  queueableFns: Array<QueueableFn>;
  setTimeout: Global['setTimeout'];
  userContext: any;
};

export type QueueableFn = {
  fn: (done: (error?: any) => void) => void;
  timeout?: () => number;
  initError?: Error;
};

export default function queueRunner(options: Options) {
  const token = new PCancelable((onCancel: Function, resolve: Function) => {
    onCancel(resolve);
  });

  const mapper = ({fn, timeout, initError = new Error()}: QueueableFn) => {
    let promise = new Promise(resolve => {
      const next = function(...args: [Error]) {
        const err = args[0];
        if (err) {
          options.fail.apply(null, args);
        }
        resolve();
      };

      next.fail = function(...args: [Error]) {
        options.fail.apply(null, args);
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

    const timeoutMs: number = timeout();

    return pTimeout(
      promise,
      timeoutMs,
      options.clearTimeout,
      options.setTimeout,
      () => {
        initError.message =
          'Timeout - Async callback was not invoked within the ' +
          timeoutMs +
          'ms timeout specified by jest.setTimeout.';
        initError.stack = initError.message + initError.stack;
        options.onException(initError);
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
