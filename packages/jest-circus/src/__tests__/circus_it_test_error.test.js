/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * *@flow
 */

'use strict';

let circusIt;

//using jest-jasmine2's 'it' to test jest-circus's 'it'. Had to differentiate
//the two with this aliaser.

const aliasCircusIt = () => {
  const {it} = require('../index.js');
  circusIt = it;
};

aliasCircusIt();

//A few of these tests require incorrect types to throw errors and thus pass
//the test. The typechecks on jest-circus would prevent that, so
//this file has been listed in the .flowconfig ignore section.

describe('test/it error throwing', () => {
  it(`doesn't throw an error with valid arguments`, () => {
    expect(() => {
      circusIt('test', () => {});
    }).not.toThrowError();
  });
  it(`throws error with missing callback function`, () => {
    expect(() => {
      circusIt('test');
    }).toThrowError('Missing second argument. It must be a callback function.');
  });
  it(`throws an error when first argument isn't a string`, () => {
    expect(() => {
      circusIt(() => {});
    }).toThrowError(`Invalid first argument, () => {}. It must be a string.`);
  });
  it('throws an error when callback function is not a function', () => {
    expect(() => {
      circusIt('test', 'test2');
    }).toThrowError(
      `Invalid second argument, test2. It must be a callback function.`,
    );
  });
});
