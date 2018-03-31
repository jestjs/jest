/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import matchers from '../matchers';

it('passes back a fixit when the values are two numbers', () => {
  const toEqual = matchers['toEqual'];
  const results = toEqual(1, 2);
  expect(results.fixit).toBeTruthy();
});

it('passes a null fixit when the values are not two numbers', () => {
  const toEqual = matchers['toEqual'];
  const results = toEqual(1, '');
  expect(results.fixit).toBeFalsy();
});
