/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from '@jest/globals';

describe('console forwarding', () => {
  it('console.log works', () => {
    console.log('hello from browser console.log');
    expect(true).toBe(true);
  });

  it('console.warn works', () => {
    console.warn('hello from browser console.warn');
    expect(true).toBe(true);
  });

  it('console.error works', () => {
    console.error('hello from browser console.error');
    expect(true).toBe(true);
  });
});
