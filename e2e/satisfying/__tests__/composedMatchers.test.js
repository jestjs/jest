/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
it('Satisfying composed inside other matchers works', () => {
  const user1 = {age: 50, email: 'john4@gmail.com', score: 0.2};
  const user2 = {age: 50, email: 'ted5@gmail.com', score: 0.8};
  const users = [user1, user2];
  expect(users).toEqual(
    expect.arrayContaining([
      expect.objectContaining({score: expect.satisfying(n => n > 0.5)}),
    ]),
  );
});
