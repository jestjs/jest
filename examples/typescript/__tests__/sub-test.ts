// Copyright (c) Meta Platforms, Inc. and affiliates.

import {expect, it} from '@jest/globals';
import sub from '../sub';

it('subtracts 5 - 1 to equal 4 in TypeScript', () => {
  expect(sub(5, 1)).toBe(4);
});
