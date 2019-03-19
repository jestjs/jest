/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type SharedHookType = 'afterAll' | 'beforeAll';
export type HookType = SharedHookType | 'afterEach' | 'beforeEach';

describe.each([['beforeEach'], ['beforeAll'], ['afterEach'], ['afterAll']])(
  '%s hooks error throwing',
  (fn: HookType) => {
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
          global[fn](el);
        }).toThrowError(
          'Invalid first argument. It must be a callback function.',
        );
      },
    );
  },
);
