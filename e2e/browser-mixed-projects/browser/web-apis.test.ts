/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from '@jest/globals';

describe('Web APIs (real browser)', () => {
  it('has real localStorage', () => {
    localStorage.setItem('test-key', 'test-value');
    expect(localStorage.getItem('test-key')).toBe('test-value');
    localStorage.removeItem('test-key');
  });

  it('has real URL API', () => {
    const url = new URL('https://example.com/path?q=1');
    expect(url.hostname).toBe('example.com');
    expect(url.searchParams.get('q')).toBe('1');
  });

  it('supports requestAnimationFrame', () => {
    expect(typeof requestAnimationFrame).toBe('function');
  });

  it('has real crypto API', () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    expect(array.some(v => v !== 0)).toBe(true);
  });
});
