/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

describe('hooks error throwing', () => {
  test.each([['beforeEach'], ['beforeAll'], ['afterEach'], ['afterAll']])(
    '%s throws an error when the first argument is not a function',
    fn => {
      ['String', 1, {}, Symbol('hello'), true, null, undefined].forEach(el =>
        expect(() => {
          global[fn](el);
        }).toThrowError(
          'Invalid first argument. It must be a callback function.',
        ),
      );
    },
  );
});
