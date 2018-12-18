/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const jestExpect = require('../');

describe('.assertions()', () => {
  it('does not throw', () => {
    jestExpect.assertions(2);
    jestExpect('a').not.toBe('b');
    jestExpect('a').toBe('a');
  });

  it('redeclares different assertion count', () => {
    jestExpect.assertions(3);
    jestExpect('a').not.toBe('b');
    jestExpect('a').toBe('a');
    jestExpect.assertions(2);
  });
  it('expects no assertions', () => {
    jestExpect.assertions(0);
  });
});

describe('.hasAssertions()', () => {
  it('does not throw if there is an assertion', () => {
    jestExpect.hasAssertions();
    jestExpect('a').toBe('a');
  });

  it('throws if passed parameters', () => {
    jestExpect(() => {
      jestExpect.hasAssertions(2);
    }).toThrow(/does not accept any arguments/);
  });

  it('hasAssertions not leaking to global state', () => {});
});
