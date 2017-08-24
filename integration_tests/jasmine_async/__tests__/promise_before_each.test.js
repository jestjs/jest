/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

describe('promise beforeEach', () => {
  beforeEach(() => {
    return new Promise(resolve => {
      process.nextTick(resolve);
    }).then(() => {
      this.flag = 1;
    });
  });

  // passing tests
  it('runs tests after beforeEach asynchronously completes', () => {
    expect(this.flag).toBe(1);
  });

  // failing tests
  describe('done - with error thrown', () => {
    beforeEach(done => {
      throw new Error('fail');
      done(); // eslint-disable-line
    });
    it('fails', () => {});
  });

  describe('done - with error called back', () => {
    beforeEach(done => {
      done(new Error('fail'));
    });
    it('fails', () => {});
  });
});
