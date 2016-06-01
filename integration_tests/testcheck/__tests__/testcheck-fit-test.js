/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

describe('testcheck-fit', () => {
  check.fit('runs tests with fit exclusively', [], () => {
    expect(true).toBe(true);
  });

  check.it('should not run this test', [], () => {
    expect(true).toBe(false);
  });

  it('should not run this test either', () => {
    expect(true).toBe(false);
  });
});
