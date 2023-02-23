/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

it.each([1, 2, 3])('test%d', n => {
  expect(n).toMatchSnapshot();
});

describe.each([1, 2])('describe%d', () => {
  it.each([4, 5, 6])('test%d', n => {
    expect(n).toMatchSnapshot();
  });
});

describe('describe3', () => {
  it.each([10, 11, 12])('test%d', n => {
    expect(n).toMatchSnapshot();
  });

  describe('describe4', () => {
    it.each([13, 14, 15])('test%d', n => {
      expect(n).toMatchSnapshot();
    });
  });
});
