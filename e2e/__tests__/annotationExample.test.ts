/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {helper} from './annotationHelper';

test('failing snapshot example', () => {
  expect('two').toMatchSnapshot();
});

describe('nested', () => {
  test('failing example', () => {
    expect(10).toBe(1);
  });
});

test('passing helper', () => {
  expect(() => helper()).toThrow('Helper logged an error');
});

test('failing helper', () => {
  helper();
});
