/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
  it('runs afterAll afterAll tests', () => {
    expect(this.flag).toBeUndefined();
    expect(localFlag).toBe(true);
  });

  it('waits for afterAll to asynchronously complete beforeEach test', () => {
    expect(this.flag).toBeUndefined();
    expect(localFlag).toBe(true);
  });
});
