/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as vm from 'vm';
import {isError} from '../isError';

describe('not an Error', () => {
  test.each([
    undefined,
    null,
    true,
    42,
    'error',
    Symbol(),
    [],
    {},
    {message: 'fake', stack: 'no stack'},
  ])('%p', value => {
    expect(isError(value)).toBe(false);
  });
});

test('Error instance', () => {
  expect(isError(new Error())).toBe(true);
});

test.each([TypeError, RangeError, SyntaxError, ReferenceError, URIError])(
  '%p subclass',
  Ctor => {
    expect(isError(new Ctor())).toBe(true);
  },
);

test('custom Error subclass', () => {
  class MyError extends Error {}
  expect(isError(new MyError())).toBe(true);
});

describe('cross-realm', () => {
  test('Error from another vm context', () => {
    const error = vm.runInNewContext('new Error("cross-realm")');
    // instanceof fails across realms; isError must not
    expect(error instanceof Error).toBe(false);
    expect(isError(error)).toBe(true);
  });

  test('TypeError from another vm context', () => {
    const error = vm.runInNewContext('new TypeError("cross-realm")');
    expect(isError(error)).toBe(true);
  });

  test('thrown error from another vm context', () => {
    let error: unknown;
    try {
      vm.runInNewContext('null.x');
    } catch (thrownError) {
      error = thrownError;
    }
    expect(isError(error)).toBe(true);
  });

  test('plain object from another vm context is not an error', () => {
    const obj = vm.runInNewContext('({message: "nope", stack: "nope"})');
    expect(isError(obj)).toBe(false);
  });
});
