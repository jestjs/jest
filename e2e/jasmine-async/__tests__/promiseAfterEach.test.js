/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

describe('promise afterEach', () => {
  let localFlag = true;

  afterEach(() => {
    this.flag = 1;
    localFlag = false;
    return new Promise(resolve => {
      process.nextTick(resolve);
    }).then(() => {
      this.flag = undefined;
    });
  });

  // passing tests
  it('runs afterEach after each test', () => {
    expect(this.flag).toBeUndefined();
    expect(localFlag).toBe(true);
  });

  it('waits for afterEach to asynchronously complete before each test', () => {
    expect(this.flag).toBeUndefined();
    expect(localFlag).toBe(false);
  });
});
