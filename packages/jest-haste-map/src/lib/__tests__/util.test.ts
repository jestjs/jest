/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {copy, copyMap, createEmptyMap} from '../util';

describe('copy', () => {
  it('returns a null-prototype object', () => {
    expect(Object.getPrototypeOf(copy({a: 1}))).toBeNull();
  });

  it('copies own enumerable properties', () => {
    const src = {a: 1, b: 'x'};
    const result = copy(src);
    expect(result.a).toBe(1);
    expect(result.b).toBe('x');
  });

  it('is independent from source after copy', () => {
    const src: Record<string, unknown> = {a: 1};
    const result = copy(src);
    src.a = 99;
    expect(result.a).toBe(1);
  });
});

describe('copyMap', () => {
  it('returns a new Map with the same entries', () => {
    const src = new Map([
      ['a', 1],
      ['b', 2],
    ]);
    const result = copyMap(src);
    expect(result).not.toBe(src);
    expect([...result]).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });

  it('is independent from source after copy', () => {
    const src = new Map([['k', 'v']]);
    const result = copyMap(src);
    src.set('k', 'changed');
    expect(result.get('k')).toBe('v');
  });
});

describe('createEmptyMap', () => {
  it('returns an object with the five required Maps', () => {
    const m = createEmptyMap();
    expect(m.clocks).toBeInstanceOf(Map);
    expect(m.duplicates).toBeInstanceOf(Map);
    expect(m.files).toBeInstanceOf(Map);
    expect(m.map).toBeInstanceOf(Map);
    expect(m.mocks).toBeInstanceOf(Map);
  });

  it('returns a fresh object each call', () => {
    const a = createEmptyMap();
    const b = createEmptyMap();
    expect(a).not.toBe(b);
    expect(a.files).not.toBe(b.files);
  });
});
