/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.useRealTimers();

test('works just fine', () => {
  return new Promise(resolve => {
    // Make the second test finish last to get consistent console
    // output
    setTimeout(resolve, 2000);
  }).then(() => {
    console.error('This is an error from another test file.');
  });
});
