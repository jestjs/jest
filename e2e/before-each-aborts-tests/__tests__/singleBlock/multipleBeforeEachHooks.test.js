/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('a block with multiple beforeEach hooks', () => {
  beforeEach(() => {
    console.log('first beforeEach');
    throw new Error('The first beforeEach hook failed.');
  });

  beforeEach(() => {
    console.log('second beforeEach');
    throw new Error('The second beforeEach hook failed.');
  });

  test('skipped test', () => {
    console.log('test');
  });
});
