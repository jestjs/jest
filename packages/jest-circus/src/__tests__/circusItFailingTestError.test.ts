/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Global} from '@jest/types';

let circusIt: Global.It;
let circusTest: Global.It;

const aliasCircusIt = () => {
  const {it, test} = require('../');
  circusIt = it;
  circusTest = test;
};

aliasCircusIt();

describe('test/it.failing error throwing', () => {
  it("it doesn't throw an error with valid arguments", () => {
    expect(() => {
      circusIt.failing('test1', () => {});
    }).not.toThrowError();
  });
  it('it throws error with missing callback function', () => {
    expect(() => {
      circusIt.failing('test2');
    }).toThrowError(
      'Missing second argument. It must be a callback function. Perhaps you want to use `test.todo` for a test placeholder.',
    );
  });
  it("it throws an error when first argument isn't valid", () => {
    expect(() => {
      circusIt.failing(() => {});
    }).toThrowError(
      'Invalid first argument, () => {}. It must be a named class, named function, number, or string.',
    );
  });
  it('it throws an error when callback function is not a function', () => {
    expect(() => {
      circusIt.failing('test4', 'test4b');
    }).toThrowError(
      'Invalid second argument, test4b. It must be a callback function.',
    );
  });
  it('test throws error with missing callback function', () => {
    expect(() => {
      circusTest.failing('test5');
    }).toThrowError(
      'Missing second argument. It must be a callback function. Perhaps you want to use `test.todo` for a test placeholder.',
    );
  });
  it("test throws an error when first argument isn't a string", () => {
    expect(() => {
      circusTest.failing(() => {});
    }).toThrowError(
      'Invalid first argument, () => {}. It must be a named class, named function, number, or string.',
    );
  });
  it('test throws an error when callback function is not a function', () => {
    expect(() => {
      circusTest.failing('test7', 'test8b');
    }).toThrowError(
      'Invalid second argument, test8b. It must be a callback function.',
    );
  });
});
