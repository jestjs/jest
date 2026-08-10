/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import jestExpect from '../';

jestExpect.extend({
  toCustomMatch(callback: () => unknown, expected: unknown) {
    const actual = callback();

    if (actual !== expected) {
      return {
        message: () => `Expected "${expected}" but got "${actual}"`,
        pass: false,
      };
    }

    return {
      message: () => '',
      pass: true,
    };
  },
  toMatchPredicate(received: unknown, expected: (a: unknown) => void) {
    expected(received);
    return {
      message: () => '',
      pass: true,
    };
  },
});

declare module '../types' {
  interface Matchers<R> {
    toCustomMatch(expected: unknown): R;
    toMatchPredicate(expected: (a: unknown) => void): R;
  }
}

it('stack trace points to correct location when using matchers', () => {
  try {
    jestExpect(true).toBe(false);
  } catch (error: any) {
    expect(error.stack).toContain('stacktrace.test.ts:45:22');
  }
});

it('stack trace points to correct location when using nested matchers', () => {
  try {
    jestExpect(true).toMatchPredicate((value: unknown) => {
      jestExpect(value).toBe(false);
    });
  } catch (error: any) {
    expect(error.stack).toContain('stacktrace.test.ts:54:25');
  }
});

it('stack trace points to correct location when throwing from a custom matcher', () => {
  try {
    jestExpect(() => {
      const foo = () => bar();
      const bar = () => baz();
      const baz = () => {
        throw new Error('Expected');
      };

      foo();
    }).toCustomMatch('bar');
  } catch (error: any) {
    expect(error.stack).toContain('stacktrace.test.ts:67:15');
  }
});
