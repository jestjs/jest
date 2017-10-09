/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

test('v8 module', () => {
  expect(() => require('v8')).not.toThrow();

  expect(require('v8').getHeapStatistics().total_heap_size).toBeDefined();
});
