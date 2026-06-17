/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
it('Satisfying negation assertion works', () => {
  const isEmpty = x => x.length === 0;
  const value = [1, 2, 3];
  expect(value).toEqual(expect.not.satisfying(isEmpty));
});
