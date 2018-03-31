/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {fixitForToEqual} from '../to_equal';

it('returns fixit metadata for two numbers', () => {
  expect(fixitForToEqual(1, 2)).toMatchSnapshot();
});

it('returns null metadata for other types', () => {
  expect(fixitForToEqual(1, '')).toBeFalsy();
  expect(fixitForToEqual('1', '')).toBeFalsy();
  expect(fixitForToEqual({}, [])).toBeFalsy();
  expect(fixitForToEqual('', [])).toBeFalsy();
});
