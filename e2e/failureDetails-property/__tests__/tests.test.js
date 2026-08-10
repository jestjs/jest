/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

describe('my test', () => {
  test('it passes', () => {
    expect(true).toBe(false);
  });

  it('fails :(', () => {
    expect(true).toBe(false);
  });

  test('a snapshot failure', () => {
    expect({
      p1: 'hello',
      p2: 'world',
    }).toMatchInlineSnapshot(`
      {
        "p1": "hello",
        "p2": "sunshine",
      }
    `);
  });
});

it('throws!', () => {
  throw new Error();
});

test('promise rejection', async () => {
  // eslint-disable-next-line jest/require-to-throw-message
  await expect(Promise.resolve(1)).rejects.toThrow();
});
