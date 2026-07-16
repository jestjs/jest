/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

describe('promise beforeEach', () => {
  beforeEach(() =>
    new Promise(resolve => {
      process.nextTick(resolve);
    }).then(() => {
      this.flag = 1;
    }),
  );

  // passing tests
  it('runs tests after beforeEach asynchronously completes', () => {
    expect(this.flag).toBe(1);
  });

  // failing tests
  describe('done - with error thrown', () => {
    beforeEach(done => {
      throw new Error('fail');
      // eslint-disable-next-line no-unreachable
      done();
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
