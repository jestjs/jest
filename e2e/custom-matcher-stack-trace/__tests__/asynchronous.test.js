/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

expect.extend({toThrowCustomAsyncMatcherError});

test('showing the stack trace for an async matcher', () =>
  expect(true).toThrowCustomAsyncMatcherError());

function toThrowCustomAsyncMatcherError() {
  const message = () =>
    'We expect the stack trace and code fence for this matcher to be shown in the console.';
  return Promise.resolve({message, pass: false});
}
