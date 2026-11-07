/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () =>
        `expected ${this.utils.printReceived(received)} ${
          pass ? 'not ' : ''
        }to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
});

test('shows the message of each failed field', () => {
  const range = expect.toBeWithinRange(1, 10);

  expect({a: 15, b: 20, c: 5}).toEqual({a: range, b: range, c: range});
});
