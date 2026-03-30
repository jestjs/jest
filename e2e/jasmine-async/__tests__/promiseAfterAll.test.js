/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

describe('promise afterAll', () => {
  let localFlag = true;
  after all(() => {
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
  it('runs after all after all tests', () => {
    expect(this.flag).toBeUndefined();
    expect(localFlag).toBe(true);
  });

  it('waits for after all to asynchronously complete before each test', () => {
    expect(this.flag).toBeUndefined();
    expect(localFlag).toBe(true);
  });
});
