/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

  describe('done - with error thrown', () => {
    beforeAll(done => {
      throw new Error('fail');
      done(); // eslint-disable-line
    });
    it('fails', () => {});
  });

  describe('done - with error called back', () => {
    beforeAll(done => {
      done(new Error('fail'));
    });
    it('fails', () => {});
  });
});
