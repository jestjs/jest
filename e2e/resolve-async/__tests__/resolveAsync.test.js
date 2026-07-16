/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import greeting from '../some-file';

test('async resolver resolves to correct file', () => {
  expect(greeting).toBe('Hello from mapped file!!');
});
