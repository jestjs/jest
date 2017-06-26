/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

describe('promise beforeAll', () => {
  beforeAll(() => {
    return new Promise(resolve => {
      process.nextTick(resolve);
    }).then(() => {
      this.flag = 1;
    });
  });

  beforeAll(() => {
    return new Promise(resolve => setTimeout(resolve, 10));
  }, 500);

  // passing tests
  it('runs tests after beforeAll asynchronously completes', () => {
    expect(this.flag).toBe(1);
  });

  describe('with failing timeout', () => {
    // failing before hook
    beforeAll(() => {
      return new Promise(resolve => setTimeout(resolve, 100));
    }, 10);

    it('fails', () => {});
  });
});
