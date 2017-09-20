/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
});

it('stack trace points to correct location when using matchers', () => {
  try {
    jestExpect(true).toMatch(false);
  } catch (error) {
    expect(error.stack).toContain('stacktrace.test.js:24');
  }
});

it('stack trace points to correct location when using nested matchers', () => {
  try {
    const predicate = value => {
      jestExpect(value).toBe(false);
    };
    jestExpect(true).toMatchPredicate(predicate);
  } catch (error) {
    expect(error.stack).toContain('at predicate');
    expect(error.stack).toContain('stacktrace.test.js:33');
  }
});
