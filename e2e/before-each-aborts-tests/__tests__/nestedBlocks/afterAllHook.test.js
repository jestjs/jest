/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('afterAll hooks with a nested beforeEach', () => {
  it('outer test', () => {
    console.log('outer test');
  });

  describe('nested block', () => {
    beforeEach(() => {
      console.log('nested beforeEach');
      throw new Error('The nested beforeEach hook failed.');
    });

    it('nested test', () => {
      console.log('nested test');
    });

    afterAll(() => {
      console.log('nested afterAll');
    });
  });

  afterAll(() => {
    console.log('outer afterAll');
  });
});
