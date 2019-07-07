/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

beforeEach(() => {
  console.log('global beforeEach');
  throw new Error('The global beforeEach hook failed.');
});

it('global test', () => {
  console.log('global test');
});

afterAll(() => {
  console.log('global afterAll');
});
