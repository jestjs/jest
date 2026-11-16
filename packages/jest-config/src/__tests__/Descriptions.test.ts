/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {descriptions} from '../';

test('get configuration descriptions', () => {
  expect(descriptions).toBeDefined();
  expect(descriptions.maxWorkers).toContain('50% of your CPU amount');
  expect(descriptions.maxWorkers).not.toContain('+ 1');
});
