/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment jest-environment-jsdom
 * @jest-environment-options {"customExportConditions": ["special"]}
 */

import {fn} from 'fake-dual-dep';

test('returns correct message', () => {
  expect(fn()).toEqual('hello from special');
});
