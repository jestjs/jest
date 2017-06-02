/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

describe('promise beforeAll', () => {
  let flag;

  beforeAll(() => {
    return new Promise(resolve => {
      process.nextTick(resolve);
    }).then(() => {
      flag = 1;
    });
  });

  beforeAll(() => {
    return new Promise(resolve => setTimeout(resolve, 10));
  }, 500);

  // passing tests
  it('runs tests after beforeAll asynchronously completes', () => {
    expect(flag).toBe(1);
  });

  describe('with failing async', () => {
    // failing before hook
    beforeAll(() => {
      return new Promise(resolve => setTimeout(resolve, 100));
    }, 11);

    it('fails', () => {});
  });
});
