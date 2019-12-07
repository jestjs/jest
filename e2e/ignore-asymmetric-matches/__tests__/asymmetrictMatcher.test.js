/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('minimal test', () => {
  const expected = {a: expect.any(Number), b: 2};
  const received = {a: 1, b: 1};
  expect(expected).toEqual(received);
});

test('jest asymmetricMatcher', () => {
  const expected = {
    a: expect.any(Number),
    b: expect.anything(),
    c: expect.arrayContaining([1, 3]),
    d: 'jest is awesome',
    e: 'jest is awesome',
    f: {
      a: new Date(0),
      b: 'jest is awesome',
    },
    g: true,
  };
  const received = {
    a: 1,
    b: 'anything',
    c: [1, 2, 3],
    d: expect.stringContaining('jest'),
    e: expect.stringMatching(/^jest/),
    f: expect.objectContaining({
      a: expect.any(Date),
    }),
    g: false,
  };

  expect(expected).toEqual(received);
});

test('custom asymmetricMatcher', () => {
  expect.extend({
    equal5(received) {
      if (received === 5)
        return {
          message: () => `expected ${received} not to be 5`,
          pass: true,
        };
      return {
        message: () => `expected ${received} to be 5`,
        pass: false,
      };
    },
  });
  const expected = {
    a: expect.equal5(),
    b: false,
  };
  const received = {
    a: 5,
    b: true,
  };

  expect(expected).toEqual(received);
});

test('nested object', () => {
  const expected = {
    a: 1,
    b: {
      a: 1,
      b: expect.any(Number),
    },
    c: 2,
  };
  const received = {
    a: expect.any(Number),
    b: {
      a: 1,
      b: 2,
    },
    c: 1,
  };
  expect(expected).toEqual(received);
});

test('circular', () => {
  const expected = {
    b: expect.any(Number),
    c: 3,
  };
  expected.a = expected;
  const received = {
    b: 2,
    c: 2,
  };
  received.a = received;
  expect(expected).toEqual(received);
});

test('transitive circular', () => {
  const expected = {
    a: 3,
  };
  expected.nested = {b: expect.any(Number), parent: expected};
  const received = {
    a: 2,
  };
  received.nested = {b: 2, parent: received};
  expect(expected).toEqual(received);
});
