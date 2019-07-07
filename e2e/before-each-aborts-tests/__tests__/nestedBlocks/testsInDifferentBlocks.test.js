/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('tests for the nested beforeEach', () => {
  it('outer test', () => {
    console.log('outer test');
  });

  describe('nested block', () => {
    beforeEach(() => {
      console.log('nested beforeEach');
      throw new Error('The nested beforeEach hook failed.');
    });

    it('first nested test', () => {
      console.log('first nested test');
    });

    it('second nested test', () => {
      console.log('second nested test');
    });
  });
});
