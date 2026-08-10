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
  } catch (error) {
    throw buildErrorWithCause('error during f', {cause: error});
  }
}

test('error with cause in test', () => {
  f();
});

describe('describe block', () => {
  it('error with cause in describe/it', () => {
    f();
  });

  it('error with string cause in describe/it', () => {
    throw buildErrorWithCause('with string cause', {
      cause: 'here is the cause',
    });
  });
});
