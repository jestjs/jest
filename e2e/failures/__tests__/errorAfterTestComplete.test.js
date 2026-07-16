/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

test('a failing test', done => {
  setTimeout(() => done('fail async'), 5);
  done();
});
