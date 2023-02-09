/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect, test} from '@jest/globals';
import '../toBeWithinRange';

test('is within range', () => expect(100).toBeWithinRange(90, 110));

test('is NOT within range', () => expect(101).not.toBeWithinRange(0, 100));

test('asymmetric ranges', () => {
  expect({apples: 6, bananas: 3}).toEqual({
    apples: expect.toBeWithinRange(1, 10),
    bananas: expect.not.toBeWithinRange(11, 20),
  });
});
