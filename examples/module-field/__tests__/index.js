/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
import Contents from '../sample';

describe('module field resolution', () => {
  it('should return the correct file exports', () => {
    expect(Contents).toBe('👏');
  });
});
