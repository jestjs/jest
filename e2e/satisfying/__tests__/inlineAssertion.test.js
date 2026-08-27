/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
it('Satisfying inline assertion works', () => {
  const user = {age: 50, email: 'john4@gmail.com'};
  expect(user).toEqual({
    age: expect.satisfying(n => n >= 18),
    email: expect.stringMatching(/@/),
  });
});
