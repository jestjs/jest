/**
 * Ported from vitest/test/browser/test/basic.test.ts
 */

import {describe, expect, it} from '@jest/globals';

it('globalThis.performance is defined', () => {
  expect(globalThis.performance).toBeDefined();
});

it('globalThis.window is defined', () => {
  expect(globalThis.window).toBeDefined();
});

it.each([
  ['x', true],
  ['y', false],
])('%s is x → %s', (val, expectedResult) => {
  expect(val === 'x').toBe(expectedResult);
});

describe('browser environment basics', () => {
  it('document is defined', () => {
    expect(document).toBeDefined();
    expect(document.createElement).toBeInstanceOf(Function);
  });

  it('navigator is defined', () => {
    expect(navigator).toBeDefined();
    expect(navigator.userAgent).toBeDefined();
  });

  it('location is defined', () => {
    expect(location).toBeDefined();
    expect(location.href).toBeDefined();
  });

  it('fetch is defined', () => {
    expect(fetch).toBeInstanceOf(Function);
  });

  it('requestAnimationFrame is defined', () => {
    expect(requestAnimationFrame).toBeInstanceOf(Function);
  });

  it('localStorage is defined', () => {
    expect(localStorage).toBeDefined();
    localStorage.setItem('test-key', 'test-value');
    expect(localStorage.getItem('test-key')).toBe('test-value');
    localStorage.removeItem('test-key');
  });
});
