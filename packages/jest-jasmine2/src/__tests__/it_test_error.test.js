/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

describe('test/it error throwing', () => {
  it(`throws error with missing callback function`, () => {
    expect(() => {
      it('test1');
    }).toThrowError('Missing second argument. It must be a callback function.');
  });
  it(`throws an error when first argument isn't a string`, () => {
    expect(() => {
      it(() => {});
    }).toThrowError(`Invalid first argument, () => {}. It must be a string.`);
  });
  it('throws an error when callback function is not a function', () => {
    expect(() => {
      it('test2', 'test3');
    }).toThrowError(
      `Invalid second argument, test3. It must be a callback function.`,
    );
  });
});
