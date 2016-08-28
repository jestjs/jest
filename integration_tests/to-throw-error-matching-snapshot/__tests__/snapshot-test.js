/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

describe('toThowErrorMatchingSnapshot', () => {

  it('works fine when function throws error', () => {
    expect(() => { throw new Error('apple'); })
      .toThowErrorMatchingSnapshot();
  });

  it('cannot be used with .not', () => {
    expect(() => expect('').not.toThowErrorMatchingSnapshot()).toThrow(
      new Error(
        'Jest: `.not` can not be used with `.toThowErrorMatchingSnapshot()`.')
    );
  });
});
