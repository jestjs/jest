/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

function toCustomMatch(callback, expectation) {
  const actual = callback();

  if (actual === expectation) {
    return {pass: true};
  } else {
    return {
      message: () => `Expected "${expectation}" but got "${actual}"`,
      pass: false,
    };
  }
}

expect.extend({
  toCustomMatch,
});

describe('Custom matcher', () => {
  it('passes', () => {
    // This expectation should pass
    expect(() => 'foo').toCustomMatch('foo');
  });

  it('fails', () => {
    expect(() => {
      // This expectation should fail,
      // Which is why it's wrapped in a .toThrow() block.
      expect(() => 'foo').toCustomMatch('bar');
    }).toThrow('Expected "bar" but got "foo"');
  });

  it('preserves error stack', () => {
    const foo = () => bar();
    const bar = () => baz();
    const baz = () => {
      // eslint-disable-next-line unicorn/throw-new-error,unicorn/new-for-builtins
      throw Error('qux');
    };

    // This expectation fails due to an error we throw (intentionally)
    // The stack trace should point to the line that throws the error though,
    // Not to the line that calls the matcher.
    expect(() => {
      foo();
    }).toCustomMatch('test');
  });
});
