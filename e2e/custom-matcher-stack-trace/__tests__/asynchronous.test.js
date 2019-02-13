/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

expect.extend({toThrowCustomAsyncMatcherError});

test('showing the stack trace for an async matcher', async () => {
  await expect(true).toThrowCustomAsyncMatcherError();
});

async function toThrowCustomAsyncMatcherError() {
  const message = () =>
    'We expect the stack trace and code fence for this matcher to be shown in the console.';
  return {message, pass: false};
}
