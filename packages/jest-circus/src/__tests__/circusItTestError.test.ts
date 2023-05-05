/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Global} from '@jest/types';

// Aliases of `it` and `test` to avoid collision with global testing APIs.
let circusIt: Global.It;
let circusTest: Global.It;

const aliasCircusIt = () => {
  const {it, test} = require('../') as typeof import('../');
  circusIt = it;
  circusTest = test;
};

aliasCircusIt();

describe('test/it error throwing', () => {
  it("it doesn't throw an error with valid arguments", () => {
    expect(() => {
      circusIt('test1', () => {});
    }).not.toThrow();
  });
  it('it throws error with missing callback function', () => {
    expect(() => {
      // @ts-expect-error: Easy, we're testing runtime errors here
      circusIt('test2');
    }).toThrow(
      'Missing second argument. It must be a callback function. Perhaps you want to use `test.todo` for a test placeholder.',
    );
  });
  it("it throws an error when first argument isn't valid", () => {
    expect(() => {
      // @ts-expect-error: Easy, we're testing runtime errors here
      circusIt(() => {});
    }).toThrow(
      'Invalid first argument, () => {}. It must be a named class, named function, number, or string.',
    );
  });
  it('it throws an error when callback function is not a function', () => {
    expect(() => {
      // @ts-expect-error: Easy, we're testing runtime errors here
      circusIt('test4', 'test4b');
    }).toThrow(
      'Invalid second argument, test4b. It must be a callback function.',
    );
  });
  it("test doesn't throw an error with valid arguments", () => {
    expect(() => {
      circusTest('test5', () => {});
    }).not.toThrow();
  });
  it('test throws error with missing callback function', () => {
    expect(() => {
      // @ts-expect-error: Easy, we're testing runtime errors here
      circusTest('test6');
    }).toThrow(
      'Missing second argument. It must be a callback function. Perhaps you want to use `test.todo` for a test placeholder.',
    );
  });
  it("test throws an error when first argument isn't a string", () => {
    expect(() => {
      // @ts-expect-error: Easy, we're testing runtime errors here
      circusTest(() => {});
    }).toThrow(
      'Invalid first argument, () => {}. It must be a named class, named function, number, or string.',
    );
  });
  it('test throws an error when callback function is not a function', () => {
    expect(() => {
      // @ts-expect-error: Easy, we're testing runtime errors here
      circusTest('test8', 'test8b');
    }).toThrow(
      'Invalid second argument, test8b. It must be a callback function.',
    );
  });
});
