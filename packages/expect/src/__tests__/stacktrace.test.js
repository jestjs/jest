/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const jestExpect = require('../');

jestExpect.extend({
  toMatchPredicate(received, argument) {
    argument(received);
    return {
      message: () => '',
      pass: true,
    };
  },
  toPreserveErrorCallStack(callback) {
    try {
      callback();
    } catch (error) {
      const assertionError = new jestExpect.JestAssertionError(error.message);
      assertionError.stack = error.stack;
      throw assertionError;
    }
  },
});

it('stack trace points to correct location when using matchers', () => {
  try {
    jestExpect(true).toBe(false);
  } catch (error) {
    expect(error.stack).toContain('stacktrace.test.js:32');
  }
});

it('stack trace points to correct location when using nested matchers', () => {
  try {
    jestExpect(true).toMatchPredicate(value => {
      jestExpect(value).toBe(false);
    });
  } catch (error) {
    expect(error.stack).toContain('stacktrace.test.js:41');
  }
});

it('stack trace points to correct location when throwing an instance of JestAssertionError', () => {
  try {
    jestExpect(() => {
      const foo = () => bar();
      const bar = () => baz();
      const baz = () => {
        throw new Error('Expected');
      };

      foo();
    }).toPreserveErrorCallStack();
  } catch (error) {
    expect(error.stack).toContain('stacktrace.test.js:54');
  }
});
