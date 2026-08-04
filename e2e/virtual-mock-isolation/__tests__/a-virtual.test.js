/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

jest.mock('../lib/real-module', () => ({name: 'virtual mock'}), {
  virtual: true,
});

const consumer = require('../lib/consumer');

test('uses a virtual mock for a resolvable module', () => {
  expect(consumer.getName()).toBe('virtual mock');
});

// Jest runs larger suites first when no timing cache exists, so this padding
// ensures the virtual lookup populates the shared resolver cache first.
// Padding padding padding padding padding padding padding padding padding.
// Padding padding padding padding padding padding padding padding padding.
// Padding padding padding padding padding padding padding padding padding.
// Padding padding padding padding padding padding padding padding padding.
