/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

function buildErrorWithCause(message: string, opts: {cause: unknown}): Error {
  const error = new Error(message, opts);
  if (opts.cause !== error.cause) {
    // Error with cause not supported in legacy versions of node, we just polyfill it
    Object.assign(error, opts);
  }
  return error;
}

function g() {
  throw new Error('error during g');
}
function f() {
  try {
    g();
  } catch (err) {
    throw buildErrorWithCause('error during f', {cause: err});
  }
}

describe('error with cause in describe', () => {
  f();
});
