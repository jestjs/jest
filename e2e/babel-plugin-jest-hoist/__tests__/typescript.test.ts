/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable local/ban-types-eventually */

import {color} from '../entry';
import type {Color} from '../types';

jest.mock('some-module', () => ({} as Partial<{}>), {virtual: true});

jest.mock('../entry', () => {
  const color: Color = 'blue';
  return {color};
});

describe('babel-plugin-jest-hoist', () => {
  it('works even with type imports', () => {
    expect(color).toBe('blue');
  });
});
