/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('matches circular references nested in:', () => {
  interface CircularObj {
    ref: unknown;
    [prop: string]: unknown;
  }

  test('arrays', () => {
    type CircularArray = CircularObj & {ref: Array<unknown>};

    const a: CircularArray = {c: 1, ref: [1]};
    const b: CircularArray = {c: 1, ref: [1]};

    a.ref.push(a);
    b.ref.push(b);
    expect(a).toMatchObject(b);

    b.ref = [];
    expect(a).not.toMatchObject(b);

    b.ref = [1];
    expect(a).not.toMatchObject(b);
  });

  test('deeply nested array properties', () => {
    type DeepCircularArray = CircularObj & {ref: {inner: Array<unknown>}};
    const a: DeepCircularArray = {
      c: 1,
      ref: {
        inner: [1],
      },
    };
    const b: DeepCircularArray = {
      c: 1,
      ref: {
        inner: [1],
      },
    };
    a.ref.inner.push(a);
    b.ref.inner.push(b);
    expect(a).toMatchObject(b);

    b.ref.inner = [];
    expect(a).not.toMatchObject(b);

    b.ref.inner = [1];
    expect(a).not.toMatchObject(b);
  });

  test('sets', () => {
    type CircularSet = CircularObj & {ref: Set<unknown>};

    const a: CircularSet = {c: 1, ref: new Set()};
    const b: CircularSet = {c: 1, ref: new Set()};

    a.ref.add(a);
    b.ref.add(b);
    expect(a).toMatchObject(b);

    b.ref.clear();
    expect(a).not.toMatchObject(b);

    b.ref.add(1);
    expect(a).not.toMatchObject(b);
  });

  test('maps', () => {
    type CircularMap = CircularObj & {ref: Map<string, unknown>};

    const a: CircularMap = {c: 1, ref: new Map()};
    const b: CircularMap = {c: 1, ref: new Map()};

    a.ref.set('innerRef', a);
    b.ref.set('innerRef', b);
    expect(a).toMatchObject(b);

    b.ref.clear();
    expect(a).not.toMatchObject(b);

    b.ref.set('innerRef', 1);
    expect(a).not.toMatchObject(b);
  });
});
