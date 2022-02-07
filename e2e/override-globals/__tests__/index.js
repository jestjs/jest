/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

describe('parent', () => {
  beforeEach(() => {
    console.log('Promise is: ' + Promise.toString());
  });

  describe('child', () => {
    it('works well', done => {
      // A timeout to guarantee it doesn't finish after 0 ms
      setTimeout(() => {
        try {
          expect(() => new Promise()).toThrow('Booo');
          done();
        } catch (e) {
          done.fail(e);
        }
      }, 10);
    });
  });
});
