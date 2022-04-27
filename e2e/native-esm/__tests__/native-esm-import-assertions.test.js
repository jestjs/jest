/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import json from '../package.json';

test('supports top level await', () => {
  expect(json).toHaveProperty('jest.testEnvironment', 'node');
});
