/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

const jestExpect = require('../').expect;
const {stringify} = require('jest-matcher-utils');

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

  [[1, 2], [true, false], [{}, {}], [[], []], [null, undefined]].forEach(v => {
    it(`fails for: ${stringify(v[0])} and ${stringify(v[1])}`, () => {
      const fn = () => jestExpect(v[0]).toBe(v[1]);
      expect(fn).toThrowError(/Received.*but expected.*using \'===.*/);
    });
  });

  [false, 1, 'a', undefined, null, {}, []].forEach(v => {
    it(`fails for '${stringify(v)}' with '.not'`, () => {
      const fn = () => jestExpect(v).not.toBe(v);
      expect(fn).toThrowError(/Received.*but expected.*using \'!==.*/);
    });
  });

  it('does not crash on circular references', () => {
    const obj = {};
    obj.circular = obj;
    expect(() => jestExpect(obj).toBe({})).toThrowError(
      /Received.*circular.*\[Circular\].*but expected.*/,
    );
  });
});

describe('.toBeTruthy(), .toBeFalsy()', () => {
  it('does not accept arguments', () => {
    expect(() => jestExpect(0).toBeTruthy(null))
      .toThrowError(/toBeTruthy matcher does not accept any arguments/);
    expect(() => jestExpect(0).toBeFalsy(null))
      .toThrowError(/toBeFalsy matcher does not accept any arguments/);
  });

  [{}, [], true, 1, 'a', 0.5, new Map(), () => {}, Infinity].forEach(v => {
    test(`'${stringify(v)}' is truthy`, () => {
      jestExpect(v).toBeTruthy();
      jestExpect(v).not.toBeFalsy();
      expect(() => jestExpect(v).not.toBeTruthy())
        .toThrowError(/but expected it to be truthy./);
      expect(() => jestExpect(v).toBeFalsy()).toThrowError(/falsy/);
    });
  });

  [false, null, NaN, 0, '', undefined].forEach(v => {
    test(`'${stringify(v)}' is falsy`, () => {
      jestExpect(v).toBeFalsy();
      jestExpect(v).not.toBeTruthy();
      expect(() => jestExpect(v).toBeTruthy()).toThrowError(/truthy/);
      expect(() => jestExpect(v).not.toBeFalsy())
        .toThrowError(/but expected it not to be falsy./);
    });
  });
});

describe('.toBeNaN()', () => {
  it('passes', () => {
    [NaN, Math.sqrt(-1), Infinity - Infinity, 0 / 0].forEach(v => {
      jestExpect(v).toBeNaN();
      expect(() => jestExpect(v).not.toBeNaN()).toThrowError(/not to be NaN/);
    });
  });

  it('throws', () => {
    [1, '', null, undefined, {}, [], 0.2, 0, Infinity, -Infinity].forEach(v => {
      expect(() => jestExpect(v).toBeNaN()).toThrowError(/to be NaN/);
      jestExpect(v).not.toBeNaN();
    });
  });
});

describe('.toBeNull()', () => {
  [{}, [], true, 1, 'a', 0.5, new Map(), () => {}, Infinity].forEach(v => {
    test(`fails for '${stringify(v)}' with .not`, () => {
      jestExpect(v).not.toBeNull();
      expect(() => jestExpect(v).toBeNull())
        .toThrowError(/Received.*to be null/);
    });
  });

  it('pass for null', () => {
    jestExpect(null).toBeNull();
    expect(() => jestExpect(null).not.toBeNull())
      .toThrowError(/Received.*not to be null/);
  });
});

describe('.toBeDefined(), .toBeUndefined()', () => {
  [{}, [], true, 1, 'a', 0.5, new Map(), () => {}, Infinity].forEach(v => {
    test(`'${stringify(v)}' is defined`, () => {
      jestExpect(v).toBeDefined();
      jestExpect(v).not.toBeUndefined();
      expect(() => jestExpect(v).not.toBeDefined())
        .toThrowError(/not to be defined/);
      expect(() => jestExpect(v).toBeUndefined())
        .toThrowError(/to be undefined/);
    });
  });

  test('undefined is undefined', () => {
    jestExpect(undefined).toBeUndefined();
    jestExpect(undefined).not.toBeDefined();
    expect(() => jestExpect(undefined).toBeDefined())
      .toThrowError(/to be defined/);
    expect(() => jestExpect(undefined).not.toBeUndefined())
      .toThrowError(/not to be undefined/);
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
          .toThrowError(/to be greater than.*using \>/);
        expect(() => jestExpect(small).not.toBeLessThan(big))
          .toThrowError(/to be less than.*using \</);
        expect(() => jestExpect(big).not.toBeGreaterThan(small))
          .toThrowError(/not to be greater than.*using \>/);
        expect(() => jestExpect(big).toBeLessThan(small))
          .toThrowError(/to be less than.*using \</);

        expect(() => jestExpect(small).toBeGreaterThanOrEqual(big))
          .toThrowError(/to be greater than or equal.*using \>=/);
        expect(() => jestExpect(small).not.toBeLessThanOrEqual(big))
          .toThrowError(/to be less than or equal.*using \<=/);
        expect(() => jestExpect(big).not.toBeGreaterThanOrEqual(small))
          .toThrowError(/not to be greater than or equal.*using \>=/);
        expect(() => jestExpect(big).toBeLessThanOrEqual(small))
          .toThrowError(/to be less than or equal.*using \<=/);
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
          .toThrowError(/not to be greater than or equal.*using \>=/);
        expect(() => jestExpect(n1).not.toBeLessThanOrEqual(n2))
          .toThrowError(/not to be less than or equal.*using \<=/);
      });
    });
  },
);

describe('.toContain()', () => {
  [
    [[1, 2, 3, 4], 1],
    [['a', 'b', 'c', 'd'], 'a'],
    [[undefined, null], null],
    [[undefined, null], undefined],
    [[Symbol.for('a')], Symbol.for('a')],
    ['abcdef', 'abc'],
    ['11112111', '2'],
  ].forEach(([list, v]) => {
    it(`'${stringify(list)}' contains '${stringify(v)}'`, () => {
      jestExpect(list).toContain(v);
      expect(() => jestExpect(list).not.toContain(v))
        .toThrowError(/expected.*not to contain.*/);
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
        .toThrowError(/expected.*to contain.*/);
    });
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
        .toThrowError(/not to be close to/);
    });
  });

  [
    [0, 0.01],
    [1, 1.23],
    [1.23, 1.2249999],
  ].forEach(([n1, n2]) => {
    it(`throws: [${n1}, ${n2}]`, () => {
      expect(() => jestExpect(n1).toBeCloseTo(n2))
        .toThrowError(/to be close to/);
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
        .toThrowError(new RegExp(`not to be close.* with.*-digit precision`));
    });
  });
});

describe('.toMatch()', () => {
  [['foo', 'foo'], ['Foo bar', /^foo/i]].forEach(([n1, n2]) => {
    it(`passes: [${n1}, ${n2}]`, () => {
      jestExpect(n1).toMatch(n2);
      expect(() => jestExpect(n1).not.toMatch(n2))
        .toThrowError(/not to match/);
    });
  });

  [['bar', 'foo'], ['bar', /foo/]].forEach(([n1, n2]) => {
    it(`throws: [${n1}, ${n2}]`, () => {
      expect(() => jestExpect(n1).toMatch(n2))
        .toThrowError(/to match/);
      jestExpect(n1).not.toMatch(n2);
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
          .toThrowError(/it to be a string/);
        jestExpect(n1).not.toMatch(n2);
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
          .toThrowError(/to be a string or regular expression/);
        jestExpect(n1).not.toMatch(n2);
      },
    );
  });

  it('escapes strings properly', () => {
    jestExpect('this?: throws').toMatch('this?: throws');
  });
});
