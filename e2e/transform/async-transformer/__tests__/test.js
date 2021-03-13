/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import m from '../module-under-test';

test('ESM transformer intercepts', () => {
  expect(m).toEqual(42);
});
