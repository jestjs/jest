/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

jest.mock('../lib/real-module', () => ({name: 'normal mock'}));

const consumer = require('../lib/consumer');

test('uses a normal mock after a virtual mock ran', () => {
  expect(consumer.getName()).toBe('normal mock');
});
