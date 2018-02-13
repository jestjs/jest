/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

let testIt;

const itAliaser = () => {
  const {it} = require('../index.js');
  testIt = it;
};

itAliaser();

describe('test/it error throwing', () => {
  it(`doesn't throw an error with valid arguments`, () => {
    expect(() => {
      testIt('test', () => {});
    }).not.toThrowError();
  });
  it(`throws error with missing callback function`, () => {
    expect(() => {
      testIt('test');
    }).toThrowError('Missing second argument. It must be a callback function.');
  });
  it(`throws an error when first argument isn't a string`, () => {
    expect(() => {
      testIt(() => {});
    }).toThrowError(`Invalid first argument, () => {}. It must be a string.`);
  });
  it('throws an error when callback function is not a function', () => {
    expect(() => {
      testIt('test', 'test2');
    }).toThrowError(
      `Invalid second argument, test2. It must be a callback function.`,
    );
  });
});
