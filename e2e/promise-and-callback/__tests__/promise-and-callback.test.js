/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

it('promise-returning test with callback', done => {
  done();

  return Promise.resolve();
});

it('async test with callback', async done => {
  done();
});

it('test done before return value', done => {
  done();

  return 'foobar';
});
