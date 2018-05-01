/**
 * Copyright (c) 2018-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

it.each([[true, true], [true, false]])(
  'fails one row expected %s == %s',
  (left, right) => {
    expect(left).toBe(right);
  }
);

it.each([[true, false], [true, false]])(
  'fails all rows expected %s == %s',
  (left, right) => {
    expect(left).toBe(right);
  }
);

describe.each([[false, true], [true, false]])(
  'fails all rows expected %s == %s',
  (left, right) => {
    it('fails', () => {
      expect(left).toBe(right);
    });
  }
);

it.each`
  left    | right
  ${true} | ${false}
  ${true} | ${true}
`('fails one row expected $left == $right', ({left, right}) => {
  expect(left).toBe(right);
});

it.each`
  left    | right
  ${true} | ${false}
  ${true} | ${true}
`('fails all rows expected $left == $right', ({left, right}) => {
  expect(left).toBe(right);
});

describe.each`
  left    | right
  ${true} | ${false}
  ${false} | ${true}
`('fails all rows expected $left == $right', ({left, right}) => {
  it('fails ', () => {
    expect(left).toBe(right);
  });
});
