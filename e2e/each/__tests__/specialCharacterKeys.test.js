/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe.each([
  {'count(*)': 1, expected: 1},
  {'count(*)': 2, expected: 2},
])('aggregate rows', row => {
  it('counts the rows', () => {
    expect(row['count(*)']).toBe(row.expected);
  });
});

test.each([{'count(*)': 1}, {'count(*)': 2}])('row $count(*)', row => {
  expect(row['count(*)']).toBeGreaterThan(0);
});
