/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from '@jest/globals';

describe('viewport', () => {
  it('uses configured viewport dimensions', () => {
    expect(window.innerWidth).toBe(414);
    expect(window.innerHeight).toBe(896);
  });

  it('supports matchMedia', () => {
    const mql = globalThis.matchMedia('(min-width: 100px)');
    expect(mql.matches).toBe(true);
  });

  it('has devicePixelRatio', () => {
    expect(window.devicePixelRatio).toBeGreaterThan(0);
  });

  it('supports visualViewport', () => {
    expect(window.visualViewport).toBeDefined();
    expect(window.visualViewport!.width).toBeGreaterThan(0);
  });

  it('supports resize observer', () => {
    expect(typeof ResizeObserver).toBe('function');
  });

  it('supports intersection observer', () => {
    expect(typeof IntersectionObserver).toBe('function');
  });
});
