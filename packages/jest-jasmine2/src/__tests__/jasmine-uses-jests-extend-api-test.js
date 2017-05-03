/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

describe('addMatcher Adapter', () => {
  const originalExtend = expect.extend;

  beforeEach(() => {
    jasmine.addMatchers({
      _toBeValue(util, customEqualityTesters) {
        return {
          compare(actual, expected) {
            const pass = actual == expected;

            return {
              message: `Expected ${pass} to be same value as ${expected}`,
              pass,
            };
          },
        };
      },
    });

    expect.extend({
      __specialExtend() {
        return {
          message: '',
          pass: true,
        };
      },
    });
  });

  afterAll(() => {
    expect.extend = originalExtend;
  });

  it('jasmine.addMatcher calls `expect.extend`', () => {
    expect.extend = jest.genMockFunction();

    jasmine.addMatchers({});

    expect(expect.extend).toBeCalled();
  });

  it('properly aliases to the Jest API', () => {
    expect(1)._toBeValue(1);
    expect(1).not._toBeValue(2);
  });
});
