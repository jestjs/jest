/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

describe('promise afterAll', () => {
  let localFlag = true;
  afterAll(() => {
    this.flag = 1;
    localFlag = false;
    return new Promise(resolve => {
      process.nextTick(resolve);
    }).then(() => {
      console.log('unset flag');
      this.flag = undefined;
    });
  });

  // passing tests
  it('runs afterAll after all tests', () => {
    expect(this.flag).toBe(undefined);
    expect(localFlag).toBe(true);
  });

  it('waits for afterAll to asynchronously complete before each test', () => {
    expect(this.flag).toBe(undefined);
    expect(localFlag).toBe(true);
  });
});
