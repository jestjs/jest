/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from '@jest/globals';

describe('Web APIs', () => {
  it('has window object', () => {
    expect(typeof globalThis.window).toBe('object');
  });

  it('has navigator', () => {
    expect(typeof navigator.userAgent).toBe('string');
  });

  it('has fetch', () => {
    expect(typeof fetch).toBe('function');
  });

  it('has WebSocket', () => {
    expect(typeof WebSocket).toBe('function');
  });

  it('has IntersectionObserver', () => {
    expect(typeof IntersectionObserver).toBe('function');
  });

  it('has localStorage', () => {
    localStorage.setItem('test-key', 'test-value');
    expect(localStorage.getItem('test-key')).toBe('test-value');
    localStorage.removeItem('test-key');
  });
});
