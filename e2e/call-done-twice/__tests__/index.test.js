/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
describe('`done()` called more than once', () => {
  it('should fail', done => {
    done();
    done();
  });

  it('should fail inside a promise', done => {
    Promise.resolve()
      .then(() => {
        done();
        done();
      })
      .catch(err => err);
  });
});
