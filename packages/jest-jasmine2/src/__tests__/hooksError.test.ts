/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe.each(['beforeEach', 'beforeAll', 'afterEach', 'afterAll'] as const)(
  '%s hooks error throwing',
  fn => {
    test.each([
      ['String'],
      [1],
      [[]],
      [{}],
      [Symbol('hello')],
      [true],
      [null],
      [undefined],
    ])(
      `${fn} throws an error when %p is provided as a first argument to it`,
      el => {
        expect(() => {
          // @ts-expect-error: Testing runtime errors
          globalThis[fn](el);
        }).toThrow('Invalid first argument. It must be a callback function.');
      },
    );
  },
);
