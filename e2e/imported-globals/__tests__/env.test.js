/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  expect as importedExpect,
  jest as importedJest,
  test as importedTest,
} from '@jest/globals';

importedTest('they match the globals', () => {
  importedExpect(importedExpect).toBe(expect);
  importedExpect(importedJest).toBe(jest);
  importedExpect(importedTest).toBe(test);

  expect(importedExpect).toBe(expect);
  expect(importedJest).toBe(jest);
  expect(importedTest).toBe(test);
});
