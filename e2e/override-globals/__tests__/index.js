/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import _unusedRequireOverridingPromise from '..';

describe('parent', () => {
  beforeEach(() => {
    console.log(`Promise is: ${Promise.toString()}`);
  });

  describe('child', () => {
    it('works well', done => {
      // A timeout to guarantee it doesn't finish after 0 ms
      setTimeout(() => {
        try {
          expect(() => new Promise()).toThrow('Booo');
          done();
        } catch (error) {
          done.fail(error);
        }
      }, 10);
    });
  });

  it('can override atob and btoa', () => {
    // eslint-disable-next-line no-restricted-globals
    global.atob = () => 'hello';
    // eslint-disable-next-line no-restricted-globals
    global.btoa = () => 'there';

    expect(`${atob()} ${btoa()}`).toBe('hello there');
  });
});
