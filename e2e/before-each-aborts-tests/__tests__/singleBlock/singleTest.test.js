/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('a block with a single test', () => {
  beforeEach(() => {
    console.log('beforeEach');
    throw new Error('The beforeEach hook failed.');
  });

  test('skipped test', () => {
    console.log('test');
  });
});
