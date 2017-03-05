/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
/* eslint-disable max-len */

'use strict';

const jestExpect = require('../');
const {stringify} = require('jest-matcher-utils');

describe('.rejects', () => {
  it('should reject', async () => {
    await jestExpect(Promise.reject(4)).rejects.toBe(4);
    await jestExpect(Promise.reject(4)).rejects.not.toBe(5);
    await jestExpect(Promise.reject({a: 1, b: 2})).rejects.toMatchObject({a: 1});
    await jestExpect(Promise.reject({a: 1, b: 2})).rejects.not.toMatchObject({c: 1});
    await jestExpect(Promise.reject(() => {throw new Error();})).rejects.toThrow();
  });

  [
    4,
    [1],
    {a: 1},
    'a',
    true,
    null,
    undefined,
    () => {},
  ].forEach(value => {
    it(`fails non-promise value ${stringify(value)}`, async () => {
      let error;
      try {
        await jestExpect(value).rejects.toBeDefined();
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatchSnapshot();
    });
  });

  it('fails for promise that resolves', async () => {
    let error;
    try {
      await jestExpect(Promise.resolve(4)).rejects.toBe(4);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.message).toMatchSnapshot();
  });
});

describe('.resolves', () => {
  it('should resolve', async () => {
    await jestExpect(Promise.resolve(4)).resolves.toBe(4);
    await jestExpect(Promise.resolve(4)).resolves.not.toBe(5);
    await jestExpect(Promise.resolve({a: 1, b: 2})).resolves.toMatchObject({a: 1});
    await jestExpect(Promise.resolve({a: 1, b: 2})).resolves.not.toMatchObject({c: 1});
    await jestExpect(Promise.resolve(() => {throw new Error();})).resolves.toThrow();
  });

  [
    4,
    [1],
    {a: 1},
    'a',
    true,
    null,
    undefined,
    () => {},
  ].forEach(value => {
    it(`fails non-promise value ${stringify(value)}`, async () => {
      let error;
      try {
        await jestExpect(value).resolves.toBeDefined();
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatchSnapshot();
    });
  });

  it('fails for promise that rejects', async () => {
    let error;
    try {
      await jestExpect(Promise.reject(4)).resolves.toBe(4);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.message).toMatchSnapshot();
  });
});
describe('.toBe()', () => {
  it('does not throw', () => {
    jestExpect('a').not.toBe('b');
    jestExpect('a').toBe('a');
    jestExpect(1).not.toBe(2);
    jestExpect(1).toBe(1);
    jestExpect(null).not.toBe(undefined);
    jestExpect(null).toBe(null);
    jestExpect(undefined).toBe(undefined);
  });

  [
    [1, 2],
    [true, false],
    [{}, {}],
    [{a: 1}, {a: 1}],
    [{a: 1}, {a: 5}],
    ['abc', 'cde'],
    [[], []],
    [null, undefined],
  ].forEach(([a, b]) => {
    it(`fails for: ${stringify(a)} and ${stringify(b)}`, () => {
      expect(() => jestExpect(a).toBe(b))
        .toThrowErrorMatchingSnapshot();
    });
  });

  [false, 1, 'a', undefined, null, {}, []].forEach(v => {
    it(`fails for '${stringify(v)}' with '.not'`, () => {
      expect(() => jestExpect(v).not.toBe(v))
        .toThrowErrorMatchingSnapshot();
    });
  });

  it('does not crash on circular references', () => {
    const obj = {};
    obj.circular = obj;

    expect(() => jestExpect(obj).toBe({}))
      .toThrowErrorMatchingSnapshot();
  });

  test('assertion error matcherResult property contains matcher name, expected and actual values', () => {
    const actual = {a: 1};
    const expected = {a: 2};
    try {
      jestExpect(actual).toBe(expected);
    } catch (error) {
      expect(error.matcherResult).toEqual(expect.objectContaining({
        actual,
        expected,
        name: 'toBe',
      }));
    }
  });
});

describe('.toEqual()', () => {
  [
    [true, false],
    [1, 2],
    [0, -0],
    [{a: 5}, {b: 6}],
    ['banana', 'apple'],
    [null, undefined],
    [new Set([1, 2]), new Set([2, 1])],
    [{a: 1, b: 2}, jestExpect.objectContaining({a: 2})],
    [false, jestExpect.objectContaining({a: 2})],
    [[1, 3], jestExpect.arrayContaining([1, 2])],
    [1, jestExpect.arrayContaining([1, 2])],
    ['abd', jestExpect.stringContaining('bc')],
    ['abd', jestExpect.stringMatching(/bc/i)],
    [undefined, jestExpect.anything()],
    [undefined, jestExpect.any(Function)],
    ['Eve', {
      asymmetricMatch: function asymmetricMatch(who) {
        return who === 'Alice' || who === 'Bob';
      },
    }],
  ].forEach(([a, b]) => {
    test(`expect(${stringify(a)}).toEqual(${stringify(b)})`, () => {
      expect(() => jestExpect(a).toEqual(b))
        .toThrowErrorMatchingSnapshot();
    });
  });

  [
    [true, true],
    [1, 1],
    ['abc', 'abc'],
    [{a: 99}, {a: 99}],
    [new Set([1, 2]), new Set([1, 2])],
    [{a: 1, b: 2}, jestExpect.objectContaining({a: 1})],
    [[1, 2, 3], jestExpect.arrayContaining([2, 3])],
    ['abcd', jestExpect.stringContaining('bc')],
    ['abcd', jestExpect.stringMatching('bc')],
    [true, jestExpect.anything()],
    [() => {}, jestExpect.any(Function)],
    [{
      a: 1,
      b: function b() {},
      c: true,
    }, {
      a: 1,
      b: jestExpect.any(Function),
      c: jestExpect.anything(),
    }],
    ['Alice', {
      asymmetricMatch: function asymmetricMatch(who) {
        return who === 'Alice' || who === 'Bob';
      },
    }],
  ].forEach(([a, b]) => {
    test(`expect(${stringify(a)}).not.toEqual(${stringify(b)})`, () => {
      expect(() => jestExpect(a).not.toEqual(b))
        .toThrowErrorMatchingSnapshot();
    });
  });

  test('assertion error matcherResult property contains matcher name, expected and actual values', () => {
    const actual = {a: 1};
    const expected = {a: 2};
    try {
      jestExpect(actual).toEqual(expected);
    } catch (error) {
      expect(error.matcherResult).toEqual(expect.objectContaining({
        actual,
        expected,
        name: 'toEqual',
      }));
    }
  });
});

describe('.toBeInstanceOf()', () => {
  class A {}
  class B {}

  [
    [new Map(), Map],
    [[], Array],
    [new A(), A],
  ].forEach(([a, b]) => {
    test(`passing ${stringify(a)} and ${stringify(b)}`, () => {
      expect(() => jestExpect(a).not.toBeInstanceOf(b))
        .toThrowErrorMatchingSnapshot();

      jestExpect(a).toBeInstanceOf(b);
    });
  });

  [
    ['a', String],
    [1, Number],
    [true, Boolean],
    [new A(), B],
    [Object.create(null), A],
  ].forEach(([a, b]) => {
    test(`failing ${stringify(a)} and ${stringify(b)}`, () => {
      expect(() => jestExpect(a).toBeInstanceOf(b))
        .toThrowErrorMatchingSnapshot();

      jestExpect(a).not.toBeInstanceOf(b);
    });
  });

  it('throws if constructor is not a function', () => {
    expect(() => jestExpect({}).toBeInstanceOf(4))
      .toThrowErrorMatchingSnapshot();
  });
});

describe('.toBeTruthy(), .toBeFalsy()', () => {
  it('does not accept arguments', () => {
    expect(() => jestExpect(0).toBeTruthy(null))
      .toThrowErrorMatchingSnapshot();

    expect(() => jestExpect(0).toBeFalsy(null))
      .toThrowErrorMatchingSnapshot();
  });

  [{}, [], true, 1, 'a', 0.5, new Map(), () => {}, Infinity].forEach(v => {
    test(`'${stringify(v)}' is truthy`, () => {
      jestExpect(v).toBeTruthy();
      jestExpect(v).not.toBeFalsy();

      expect(() => jestExpect(v).not.toBeTruthy())
        .toThrowErrorMatchingSnapshot();

      expect(() => jestExpect(v).toBeFalsy())
        .toThrowErrorMatchingSnapshot();
    });
  });

  [false, null, NaN, 0, '', undefined].forEach(v => {
    test(`'${stringify(v)}' is falsy`, () => {
      jestExpect(v).toBeFalsy();
      jestExpect(v).not.toBeTruthy();

      expect(() => jestExpect(v).toBeTruthy())
        .toThrowErrorMatchingSnapshot();

      expect(() => jestExpect(v).not.toBeFalsy())
        .toThrowErrorMatchingSnapshot();
    });
  });
});

describe('.toBeNaN()', () => {
  it('passes', () => {
    [NaN, Math.sqrt(-1), Infinity - Infinity, 0 / 0].forEach(v => {
      jestExpect(v).toBeNaN();

      expect(() => jestExpect(v).not.toBeNaN())
        .toThrowErrorMatchingSnapshot();
    });
  });

  it('throws', () => {
    [1, '', null, undefined, {}, [], 0.2, 0, Infinity, -Infinity].forEach(v => {
      expect(() => jestExpect(v).toBeNaN())
        .toThrowErrorMatchingSnapshot();

      jestExpect(v).not.toBeNaN();
    });
  });
});

describe('.toBeNull()', () => {
  [{}, [], true, 1, 'a', 0.5, new Map(), () => {}, Infinity].forEach(v => {
    test(`fails for '${stringify(v)}' with .not`, () => {
      jestExpect(v).not.toBeNull();

      expect(() => jestExpect(v).toBeNull())
        .toThrowErrorMatchingSnapshot();
    });
  });

  it('pass for null', () => {
    jestExpect(null).toBeNull();

    expect(() => jestExpect(null).not.toBeNull())
      .toThrowErrorMatchingSnapshot();
  });
});

describe('.toBeDefined(), .toBeUndefined()', () => {
  [{}, [], true, 1, 'a', 0.5, new Map(), () => {}, Infinity].forEach(v => {
    test(`'${stringify(v)}' is defined`, () => {
      jestExpect(v).toBeDefined();
      jestExpect(v).not.toBeUndefined();

      expect(() => jestExpect(v).not.toBeDefined())
        .toThrowErrorMatchingSnapshot();

      expect(() => jestExpect(v).toBeUndefined())
        .toThrowErrorMatchingSnapshot();
    });
  });

  test('undefined is undefined', () => {
    jestExpect(undefined).toBeUndefined();
    jestExpect(undefined).not.toBeDefined();

    expect(() => jestExpect(undefined).toBeDefined())
      .toThrowErrorMatchingSnapshot();

    expect(() => jestExpect(undefined).not.toBeUndefined())
      .toThrowErrorMatchingSnapshot();
  });
});

describe(
  '.toBeGreaterThan(), .toBeLessThan(), ' +
    '.toBeGreaterThanOrEqual(), .toBeLessThanOrEqual()',
  () => {
    [
      [1, 2],
      [-Infinity, Infinity],
      [Number.MIN_VALUE, Number.MAX_VALUE],
      [0x11, 0x22],
      [0b11, 0b111],
      [0o11, 0o22],
      [0.1, 0.2],
    ].forEach(([small, big]) => {
      it(`passes: [${small}, ${big}]`, () => {
        jestExpect(small).toBeLessThan(big);
        jestExpect(small).not.toBeGreaterThan(big);
        jestExpect(big).toBeGreaterThan(small);
        jestExpect(big).not.toBeLessThan(small);

        jestExpect(small).toBeLessThanOrEqual(big);
        jestExpect(small).not.toBeGreaterThanOrEqual(big);
        jestExpect(big).toBeGreaterThanOrEqual(small);
        jestExpect(big).not.toBeLessThanOrEqual(small);
      });

      it(`throws: [${small}, ${big}]`, () => {
        expect(() => jestExpect(small).toBeGreaterThan(big))
          .toThrowErrorMatchingSnapshot();

        expect(() => jestExpect(small).not.toBeLessThan(big))
          .toThrowErrorMatchingSnapshot();

        expect(() => jestExpect(big).not.toBeGreaterThan(small))
          .toThrowErrorMatchingSnapshot();

        expect(() => jestExpect(big).toBeLessThan(small))
          .toThrowErrorMatchingSnapshot();

        expect(() => jestExpect(small).toBeGreaterThanOrEqual(big))
          .toThrowErrorMatchingSnapshot();

        expect(() => jestExpect(small).not.toBeLessThanOrEqual(big))
          .toThrowErrorMatchingSnapshot();

        expect(() => jestExpect(big).not.toBeGreaterThanOrEqual(small))
          .toThrowErrorMatchingSnapshot();

        expect(() => jestExpect(big).toBeLessThanOrEqual(small))
          .toThrowErrorMatchingSnapshot();
      });
    });

    [
      [1, 1],
      [Number.MIN_VALUE, Number.MIN_VALUE],
      [Number.MAX_VALUE, Number.MAX_VALUE],
      [Infinity, Infinity],
      [-Infinity, -Infinity],
    ].forEach(([n1, n2]) => {
      test(`equal numbers: [${n1}, ${n2}]`, () => {
        jestExpect(n1).toBeGreaterThanOrEqual(n2);
        jestExpect(n1).toBeLessThanOrEqual(n2);

        expect(() => jestExpect(n1).not.toBeGreaterThanOrEqual(n2))
          .toThrowErrorMatchingSnapshot();

        expect(() => jestExpect(n1).not.toBeLessThanOrEqual(n2))
          .toThrowErrorMatchingSnapshot();
      });
    });
  },
);

describe('.toContain(), .toContainEqual()', () => {
  const typedArray = new Int8Array(2);
  typedArray[0] = 0;
  typedArray[1] = 1;

  test('iterable', () => {
    // different node versions print iterable differently, so we can't
    // use snapshots here.
    const iterable = {
      *[Symbol.iterator]() {
        yield 1;
        yield 2;
        yield 3;
      },
    };

    jestExpect(iterable).toContain(2);
    jestExpect(iterable).toContainEqual(2);
    expect(() => jestExpect(iterable).not.toContain(1))
      .toThrowError('toContain');
    expect(() => jestExpect(iterable).not.toContainEqual(1))
      .toThrowError('toContainEqual');

  });

  [
    [[1, 2, 3, 4], 1],
    [['a', 'b', 'c', 'd'], 'a'],
    [[undefined, null], null],
    [[undefined, null], undefined],
    [[Symbol.for('a')], Symbol.for('a')],
    ['abcdef', 'abc'],
    ['11112111', '2'],
    [new Set(['abc', 'def']), 'abc'],
    [typedArray, 1],
  ].forEach(([list, v]) => {
    it(`'${stringify(list)}' contains '${stringify(v)}'`, () => {
      jestExpect(list).toContain(v);

      expect(() => jestExpect(list).not.toContain(v))
        .toThrowErrorMatchingSnapshot();
    });
  });

  [
    [[1, 2, 3], 4],
    [[null, undefined], 1],
    [[{}, []], []],
    [[{}, []], {}],
  ].forEach(([list, v]) => {
    it(`'${stringify(list)}' does not contain '${stringify(v)}'`, () => {
      jestExpect(list).not.toContain(v);

      expect(() => jestExpect(list).toContain(v))
        .toThrowErrorMatchingSnapshot();
    });
  });

  test('error cases', () => {
    expect(() => jestExpect(null).toContain(1))
      .toThrowErrorMatchingSnapshot();
  });

  [
    [[1, 2, 3, 4], 1],
    [['a', 'b', 'c', 'd'], 'a'],
    [[undefined, null], null],
    [[undefined, null], undefined],
    [[Symbol.for('a')], Symbol.for('a')],
    [[{a:'b'}, {a:'c'}], {a:'b'}],
    [new Set([1, 2, 3, 4]), 1],
    [typedArray, 1],
  ].forEach(([list, v]) => {
    it(`'${stringify(list)}' contains a value equal to '${stringify(v)}'`, () => {
      jestExpect(list).toContainEqual(v);
      expect(() => jestExpect(list).not.toContainEqual(v))
        .toThrowErrorMatchingSnapshot();
    });
  });

  [
    [[{a:'b'}, {a:'c'}], {a:'d'}],
  ].forEach(([list, v]) => {
    it(`'${stringify(list)}' does not contain a value equal to'${stringify(v)}'`, () => {
      jestExpect(list).not.toContainEqual(v);

      expect(() => jestExpect(list).toContainEqual(v))
        .toThrowErrorMatchingSnapshot();
    });
  });

  test('error cases for toContainEqual', () => {
    expect(() => jestExpect(null).toContainEqual(1))
      .toThrowErrorMatchingSnapshot();
  });
});

describe('.toBeCloseTo()', () => {
  [
    [0, 0],
    [0, 0.001],
    [1.23, 1.229],
    [1.23, 1.226],
    [1.23, 1.225],
    [1.23, 1.234],
  ].forEach(([n1, n2]) => {
    it(`passes: [${n1}, ${n2}]`, () => {
      jestExpect(n1).toBeCloseTo(n2);

      expect(() => jestExpect(n1).not.toBeCloseTo(n2))
        .toThrowErrorMatchingSnapshot();
    });
  });

  [
    [0, 0.01],
    [1, 1.23],
    [1.23, 1.2249999],
  ].forEach(([n1, n2]) => {
    it(`throws: [${n1}, ${n2}]`, () => {
      expect(() => jestExpect(n1).toBeCloseTo(n2))
        .toThrowErrorMatchingSnapshot();

      jestExpect(n1).not.toBeCloseTo(n2);
    });
  });

  [
    [0, 0.1, 0],
    [0, 0.0001, 3],
    [0, 0.000004, 5],
  ].forEach(([n1, n2, p]) => {
    it(`accepts an optional precision argument: [${n1}, ${n2}, ${p}]`, () => {
      jestExpect(n1).toBeCloseTo(n2, p);

      expect(() => jestExpect(n1).not.toBeCloseTo(n2, p))
        .toThrowErrorMatchingSnapshot();
    });
  });
});

describe('.toMatch()', () => {
  [['foo', 'foo'], ['Foo bar', /^foo/i]].forEach(([n1, n2]) => {
    it(`passes: [${n1}, ${n2}]`, () => {
      jestExpect(n1).toMatch(n2);

      expect(() => jestExpect(n1).not.toMatch(n2))
        .toThrowErrorMatchingSnapshot();
    });
  });

  [['bar', 'foo'], ['bar', /foo/]].forEach(([n1, n2]) => {
    it(`throws: [${n1}, ${n2}]`, () => {
      expect(() => jestExpect(n1).toMatch(n2))
        .toThrowErrorMatchingSnapshot();
    });
  });

  [
    [1, 'foo'],
    [{}, 'foo'],
    [[], 'foo'],
    [true, 'foo'],
    [/foo/i, 'foo'],
    [() => {}, 'foo'],
    [undefined, 'foo'],
  ].forEach(([n1, n2]) => {
    it(
      'throws if non String actual value passed:' +
        ` [${stringify(n1)}, ${stringify(n2)}]`,
      () => {
        expect(() => jestExpect(n1).toMatch(n2))
          .toThrowErrorMatchingSnapshot();
      },
    );
  });

  [
    ['foo', 1],
    ['foo', {}],
    ['foo', []],
    ['foo', true],
    ['foo', () => {}],
    ['foo', undefined],
  ].forEach(([n1, n2]) => {
    it(
      `throws if non String/RegExp expected value passed:` +
        ` [${stringify(n1)}, ${stringify(n2)}]`,
      () => {
        expect(() => jestExpect(n1).toMatch(n2))
          .toThrowErrorMatchingSnapshot();
      },
    );
  });

  it('escapes strings properly', () => {
    jestExpect('this?: throws').toMatch('this?: throws');
  });
});

describe('.toHaveLength', () => {
  [
    [[1, 2], 2],
    [[], 0],
    [['a', 'b'], 2],
    ['abc', 3],
    ['', 0],
  ].forEach(([received, length]) => {
    test(`expect(${stringify(received)}).toHaveLength(${length})`, () => {
      jestExpect(received).toHaveLength(length);
      expect(() => jestExpect(received).not.toHaveLength(length))
        .toThrowErrorMatchingSnapshot();
    });
  });

  [
    [[1, 2], 3],
    [[], 1],
    [['a', 'b'], 99],
    ['abc', 66],
    ['', 1],
  ].forEach(([received, length]) => {
    test(`expect(${stringify(received)}).toHaveLength(${length})`, () => {
      jestExpect(received).not.toHaveLength(length);
      expect(() => jestExpect(received).toHaveLength(length))
        .toThrowErrorMatchingSnapshot();
    });
  });

  test('error cases', () => {
    expect(() => jestExpect({a: 9}).toHaveLength(1))
      .toThrowErrorMatchingSnapshot();
    expect(() => jestExpect(0).toHaveLength(1))
      .toThrowErrorMatchingSnapshot();
    expect(() => jestExpect(undefined).toHaveLength(1))
      .toThrowErrorMatchingSnapshot();
  });
});


describe('.toHaveProperty()', () => {
  [
    [{a: {b: {c: {d: 1}}}}, 'a.b.c.d', 1],
    [{a: 0}, 'a', 0],
    [{a: {b: undefined}}, 'a.b', undefined],
    [{a: {b: {c: 5}}}, 'a.b', {c: 5}],
  ].forEach(([obj, keyPath, value]) => {
    test(
      `{pass: true} expect(${stringify(obj)}).toHaveProperty('${keyPath}', ${stringify(value)})`,
      () => {
        jestExpect(obj).toHaveProperty(keyPath, value);
        expect(() => jestExpect(obj).not.toHaveProperty(keyPath, value))
          .toThrowErrorMatchingSnapshot();
      },
    );
  });

  [
    [{a: {b: {c: {d: 1}}}}, 'a.b.ttt.d', 1],
    [{a: {b: {c: {d: 1}}}}, 'a.b.c.d', 2],
    [{a: {b: {c: {}}}}, 'a.b.c.d', 1],
    [{a: 1}, 'a.b.c.d', 5],
    [{}, 'a', 'test'],
    [{a: {b: 3}}, 'a.b', undefined],
    [1, 'a.b.c', 'test'],
    ['abc', 'a.b.c', {a: 5}],
    [{a: {b: {c: 5}}}, 'a.b', {c: 4}],
  ].forEach(([obj, keyPath, value]) => {
    test(
      `{pass: false} expect(${stringify(obj)}).toHaveProperty('${keyPath}', ${stringify(value)})`,
      () => {
        expect(() => jestExpect(obj).toHaveProperty(keyPath, value))
          .toThrowErrorMatchingSnapshot();
        jestExpect(obj).not.toHaveProperty(keyPath, value);
      },
    );
  });

  [
    [{a: {b: {c: {d: 1}}}}, 'a.b.c.d'],
    [{a: 0}, 'a'],
    [{a: {b: undefined}}, 'a.b'],
  ].forEach(([obj, keyPath]) => {
    test(
      `{pass: true} expect(${stringify(obj)}).toHaveProperty('${keyPath}')'`,
      () => {
        jestExpect(obj).toHaveProperty(keyPath);
        expect(() => jestExpect(obj).not.toHaveProperty(keyPath))
          .toThrowErrorMatchingSnapshot();
      },
    );
  });

  [
    [{a: {b: {c: {}}}}, 'a.b.c.d'],
    [{a: 1}, 'a.b.c.d'],
    [{}, 'a'],
    [1, 'a.b.c'],
    ['abc', 'a.b.c'],
  ].forEach(([obj, keyPath]) => {
    test(
      `{pass: false} expect(${stringify(obj)}).toHaveProperty('${keyPath}')`,
      () => {
        expect(() => jestExpect(obj).toHaveProperty(keyPath))
          .toThrowErrorMatchingSnapshot();
        jestExpect(obj).not.toHaveProperty(keyPath);
      },
    );
  });

  [
    [null, 'a.b'],
    [undefined, 'a'],
    [{a: {b: {}}}, undefined],
    [{a: {b: {}}}, null],
    [{a: {b: {}}}, 1],
  ].forEach(([obj, keyPath]) => {
    test(
      `{error} expect(${stringify(obj)}).toHaveProperty('${keyPath}')`,
      () => {
        expect(() => jestExpect(obj).toHaveProperty(keyPath))
          .toThrowErrorMatchingSnapshot();
      },
    );
  });
});

describe('toMatchObject()', () => {
  [
    [{a: 'b', c: 'd'}, {a: 'b'}],
    [{a: 'b', c: 'd'}, {a: 'b', c: 'd'}],
    [{a: 'b', t: {x: {r: 'r'}, z: 'z'}}, {a: 'b', t: {z: 'z'}}],
    [{a: 'b', t: {x: {r: 'r'}, z: 'z'}}, {t: {x: {r: 'r'}}}],
    [{a: [3, 4, 5], b: 'b'}, {a: [3, 4, 5]}],
    [{a: [3, 4, 5, 'v'], b: 'b'}, {a: [3, 4, 5, 'v']}],
    [{a: 1, c: 2}, {a: jestExpect.any(Number)}],
    [{a: {x: 'x', y: 'y'}}, {a: {x: jestExpect.any(String)}}],
    [new Set([1, 2]), new Set([1, 2])],
    [new Date('2015-11-30'), new Date('2015-11-30')],
    [{a: new Date('2015-11-30'), b: 'b'}, {a: new Date('2015-11-30')}],
    [{a: null, b: 'b'}, {a: null}],
    [{a: undefined, b: 'b'}, {a: undefined}],
    [{a: [{a: 'a', b: 'b'}]}, {a:[{a: 'a'}]}],
    [[1, 2], [1, 2]],
    [{a: undefined}, {a: undefined}],
    [[], []],
  ].forEach(([n1, n2]) => {
    it(`{pass: true} expect(${stringify(n1)}).toMatchObject(${stringify(n2)})`, () => {
      jestExpect(n1).toMatchObject(n2);
      expect(() => jestExpect(n1).not.toMatchObject(n2))
        .toThrowErrorMatchingSnapshot();
    });
  });

  [
     [{a: 'b', c: 'd'}, {e: 'b'}],
     [{a: 'b', c: 'd'}, {a: 'b!', c: 'd'}],
     [{a: 'a', c: 'd'}, {a: jestExpect.any(Number)}],
     [{a: 'b', t: {x: {r: 'r'}, z: 'z'}}, {a: 'b', t: {z: [3]}}],
     [{a: 'b', t: {x: {r: 'r'}, z: 'z'}}, {t: {l: {r: 'r'}}}],
     [{a: [3, 4, 5], b: 'b'}, {a: [3, 4, 5, 6]}],
     [{a: [3, 4, 5], b: 'b'}, {a: [3, 4]}],
     [{a: [3, 4, 'v'], b: 'b'}, {a: ['v']}],
     [{a: [3, 4, 5], b: 'b'}, {a: {b: 4}}],
     [{a: [3, 4, 5], b: 'b'}, {a: {b: jestExpect.any(String)}}],
     [[1, 2], [1, 3]],
     [[0], [-0]],
     [new Set([1, 2]), new Set([2, 1])],
     [new Date('2015-11-30'), new Date('2015-10-10')],
     [{a: new Date('2015-11-30'), b: 'b'}, {a: new Date('2015-10-10')}],
     [{a: null, b: 'b'}, {a: '4'}],
     [{a: null, b: 'b'}, {a: undefined}],
     [{a: undefined}, {a: null}],
     [{a: [{a: 'a', b: 'b'}]}, {a:[{a: 'c'}]}],
     [{a: 1, b: 1, c: 1, d: {e: {f: 555}}}, {d: {e: {f: 222}}}],
     [{}, {a: undefined}],
     [[1, 2, 3], [2, 3, 1]],
     [[1, 2, 3], [1, 2, 2]],
  ].forEach(([n1, n2]) => {
    it(`{pass: false} expect(${stringify(n1)}).toMatchObject(${stringify(n2)})`, () => {
      jestExpect(n1).not.toMatchObject(n2);
      expect(() => jestExpect(n1).toMatchObject(n2))
        .toThrowErrorMatchingSnapshot();
    });
  });

  [
     [null, {}],
     [4, {}],
     ['44', {}],
     [true, {}],
     [undefined, {}],
     [{}, null],
     [{}, 4],
     [{}, 'some string'],
     [{}, true],
     [{}, undefined],
  ].forEach(([n1, n2]) => {
    it(`throws expect(${stringify(n1)}).toMatchObject(${stringify(n2)})`, () => {
      expect(() => jestExpect(n1).toMatchObject(n2))
        .toThrowErrorMatchingSnapshot();
    });
  });
});
