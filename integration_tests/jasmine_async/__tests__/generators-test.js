/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

test('generator test passes', function* () {
  yield Promise.resolve();
  yield Promise.resolve();
});

test('generator test fails', function* () {
  yield Promise.resolve();
  yield Promise.reject();
});
