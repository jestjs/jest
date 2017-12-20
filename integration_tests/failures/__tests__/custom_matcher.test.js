/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+jsinfra
 */
'use strict';

function toCustomMatch(callback, expectation) {
  try {
    const actual = callback();

    if (actual !== expectation) {
      return {
        message: () => `Expected "${expectation}" but got "${actual}"`,
        pass: false,
      };
    }
  } catch (error) {
    // Explicitly wrap caught errors to preserve their stack
    // Without this, Jest will override stack to point to the matcher
    const assertionError = new expect.JestAssertionError();
    assertionError.message = error.message;
    assertionError.stack = error.stack;
    throw assertionError;
  }

  return {pass: true};
}

expect.extend({
  toCustomMatch,
});

describe('Custom matcher', () => {
  // This test will pass
  it('passes', () => {
    expect(() => 'foo').toCustomMatch('foo');
  });

  // This test should fail
  it('fails', () => {
    expect(() => 'foo').toCustomMatch('bar');
  });

  // This test fails due to an unrelated/unexpected error
  // It will show a helpful stack trace though
  it('preserves error stack', () => {
    const foo = () => bar();
    const bar = () => baz();
    // eslint-disable-next-line no-undef
    const baz = () => qux();

    expect(() => {
      foo();
    }).toCustomMatch('test');
  });
});
